import axios from 'axios';
import fetchJsonp from 'fetch-jsonp';
import QsMan from 'qsman';

import isAbsoluteURL from './helpers/isAbsoluteURL.js';
import combineURLs from './helpers/combineURLs.js';

/**
 * 符合接口规范的 HTTP 客户端
 * 
 * @see https://github.com/f2e-journey/treasure/blob/master/api.md
 */
class StandardHttpClient {
    /**
     * @param {AxiosRequestConfig} config
     */
    constructor(config) {
        /**
         * @type {AxiosInstance}
         */
        this.agent = axios.create(config);
        this.useInterceptors();
    }

    /**
     * 使用拦截器
     * 
     * 子类可以继承此方法来添加自己的拦截器
     */
    useInterceptors() {
        this._isResponseSuccess();
        this._descResponseError();
        this._logResponseError();
    }

    /**
     * 通过拦截器判断接口调用是否成功
     */
    _isResponseSuccess() {
        this.agent.interceptors.response.use((response) => {
            var result = response.data;
            if (this._isApiSuccess(response)) {
                return Promise.resolve([result.data, response]);
            } else {
                var message = '接口调用出错但未提供错误信息';
                if (result && result.statusInfo && result.statusInfo.message) {
                    message = result.statusInfo.message;
                }

                var error = new Error(message);
                error.response = response;
                error.request = response.request;
                error.config = response.config;

                return Promise.reject(error);
            }
        });
    }

    /**
     * 通过拦截器描述请求的错误信息
     */
    _descResponseError() {
        this.agent.interceptors.response.use(undefined, (error) => {
            // 如果 transformResponse 执行异常, 进入到拦截器做错误处理,
            // 此时的 error 是没有 config 的,
            // 因为 transformResponse 是客户端执行的逻辑, 因此认定为客户端处理出错
            if (error.config) {
                var validateStatus = error.config.validateStatus || this.agent.defaults.validateStatus;

                var response = error.response;
                if (response) { // 请求发送成功, 即前端能够拿到 HTTP 请求返回的数据
                    if (validateStatus && validateStatus(response.status)) { // HTTP 成功, 但接口调用出错
                        // 错误描述
                        error._desc = '接口调用出错';
                        // 错误分类
                        error._errorType = 'B';
                        // 错误码
                        // 如果接口调用出错但未提供错误码, 错误码默认为 0
                        error._errorCode = response.data && response.data.status ?
                                           response.data.status : 0;
                    } else { // HTTP 异常
                        error._desc = '网络请求错误';
                        error._errorType = 'H';
                        error._errorCode = response.status;
                    }
                } else { // 请求发送失败
                    error._desc = '网络请求失败';
                    error._errorType = 'A';
                    error._errorCode = error.message.charCodeAt(0);
                }
            } else {
                error._desc = '客户端处理出错';
                error._errorType = 'C';
                error._errorCode = error.message.charCodeAt(0);
            }

            return Promise.reject(error);
        });
    }

    /**
     * 通过拦截器输出请求的错误日志
     */
    _logResponseError() {
        this.agent.interceptors.response.use(undefined, function(error) {
            var method = error.config ? error.config.method : undefined;
            var url = error.config ? error.config.url : undefined;

            console.warn(`${error._desc}(${error._errorType}${error._errorCode})`,  
                         method, url,
                         error.message,
                         error.config, error.response,
                         error);

            return Promise.reject(error);
        });
    }

    /**
     * 发送请求
     * 
     * @param {AxiosRequestConfig} [config={}] 扩展的 AxiosRequestConfig
     * @param {object} [config._data] 实现类似 jquery ajax 发送数据的机制, get 请求会通过 params 机制发送; post 请求会通过 data 机制发送
     * @param {boolean} [config._jsonp] 是否通过 JSONP 来发送请求(注意此时 config 仅支持 baseURL, url, params, timeout, transformResponse 参数)
     * @param {string} [config._jsonpCallback] name of the query string parameter to specify the callback(defaults to `callback`)
     * @return {Promise}
     */
    send(config = {}) {
        this._adapterDataOption(config);

        var promise = null;
        if (config._jsonp) {
            promise = this._jsonp({
                method: 'get',
                baseURL: config.baseURL,
                url: config.url,
                params: config.params,
                timeout: config.timeout,
                transformResponse: config.transformResponse,
                _jsonpCallback: config._jsonpCallback
            });
        } else {
            promise = this._dispatchRequest(config);
        }

        return promise;
    }

    /**
     * 将 config._data 适配为 config.params 和 config.data
     * 
     * 当为 post/put/patch 请求时会将 config._data 转成 URL 编码的字符串
     */
    _adapterDataOption(config) {
        if (config._data) {
            var method = '';
            if (config.method) {
                method = config.method.toLowerCase();
            }

            // request methods 'PUT', 'POST', and 'PATCH' can send request body
            var hasRequestBodyMethods = ['put', 'post', 'patch'];
            if (hasRequestBodyMethods.indexOf(method) !== -1) {
                // 已有 config.data 时不做任何操作
                if (!config.data) {
                    config.data = typeof config._data === 'object' ?
                                  new QsMan().append(config._data).toString() : config._data;
                }
            } else {
                // 已有 config.params 时不做任何操作
                config.params = config.params || config._data;
            }
        }
    }

    /**
     * 通过 JSONP 发送请求
     * 
     * @param {object} config
     * @param {string} config.url
     * @param {string} [config.baseURL]
     * @param {object} [config.params]
     * @param {number} [config.timeout]
     * @param {Array<Function>} [config.transformResponse]
     * @param {string} [config._jsonpCallback]
     * @return {Promise}
     */
    _jsonp(config) {
        // Support baseURL config
        var baseURL = config.baseURL || this.agent.defaults.baseURL;
        if (baseURL && !isAbsoluteURL(config.url)) {
            config.url = combineURLs(baseURL, config.url);
        }

        var url = config.url;
        if (config.params) {
            url = new QsMan(url).append(config.params).toString();
        }

        if (!config.timeout) {
            config.timeout = this.agent.defaults.timeout;
        }

        var transformResponse = config.transformResponse || this.agent.defaults.transformResponse;

        var promise = fetchJsonp(url, {
            timeout: config.timeout,
            jsonpCallback: config._jsonpCallback
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            // Support transformResponse config
            var _data = data;
            if (transformResponse && Object.prototype.toString.call(transformResponse) === '[object Array]') {
                transformResponse.forEach(function(fn) {
                    _data = fn(_data);
                });
            }

            return Promise.resolve({ // 返回 AxiosResponse
                data: _data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config,
                request: 'script'
            });
        }).catch(function(error) { // 返回 AxiosError
            error.request = 'script';
            error.response = null;
            error.config = config;
            return Promise.reject(error);
        });

        // 兼容 axios 的 Interceptors 机制
        // https://github.com/axios/axios/blob/master/lib/core/Axios.js
        // 首先放入发送请求的 promise
        var chain = [promise, undefined];
        // 在链路的前面加入 intercept request
        this.agent.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
            chain.unshift(interceptor.fulfilled, interceptor.rejected);
        });
        // 在链路的后面加入 intercept response
        this.agent.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
            chain.push(interceptor.fulfilled, interceptor.rejected);
        });
        while (chain.length) {
            promise = promise.then(chain.shift(), chain.shift());
        }

        return promise;
    }

    /**
     * Dispatch a request to the server.
     * 
     * @param {AxiosRequestConfig} config
     * @return {Promise}
     */
    _dispatchRequest(config) {
        // axios promise 链: [...interceptors.request, dispatch request, ...interceptors.response]
        return this.agent(config);
    }

    /**
     * 判断接口调用是否成功
     * 
     * @param {AxiosResponse} response
     * @return {boolean}
     */
    _isApiSuccess(response) {
        var result = response.data;
        // 判断接口调用是否成功的依据
        // 1. 返回的数据应该是一个 object
        // 2. 要么没有 status 字段, 要么 status 字段等于 0
        return typeof result === 'object'
            && (typeof result.status === 'undefined' || result.status === 0);
    }
}

export default StandardHttpClient;