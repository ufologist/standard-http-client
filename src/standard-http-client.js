import axios from 'axios';
import jsonp from 'jsonp';
import QsMan from 'qsman';

/**
 * 符合接口规范的 HTTP 客户端
 * 
 * @see
 */
class StandardHttpClient {
    /**
     * @param {AxiosRequestConfig} config
     */
    constructor(config) {
        /**
         * @type {AxiosInstance}
         */
        this.axios = axios.create(config);
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
     * 通过拦截器处理接口调用是否成功
     */
    _isResponseSuccess() {
        this.axios.interceptors.response.use((response) => {
            var result = response.data;
            if (this._isApiSuccess(response)) {
                return Promise.resolve([result.data, response]);
            } else {
                // TODO 可能为空
                var error = new Error(result.statusInfo.message);
                error.response = response;
                error.request = response.request;
                error.config = response.config;

                return Promise.reject(error);
            }
        });
    }

    /**
     * 通过拦截器描述请求的错误
     */
    _descResponseError() {
        this.axios.interceptors.response.use(undefined, (error) => {
            if (error.response) { // 请求发送成功
                if (!this._isApiSuccess(error.response)) { // 接口调用出错
                    // 错误描述
                    error._desc = '接口调用出错';
                    // 错误分类
                    error._errorType = 'B';
                    // 错误码
                    // TODO 可能为空
                    error._errorCode = error.response.data.status;
                } else { // HTTP 请求错误
                    error._desc = '网络请求错误';
                    error._errorType = 'H';
                    error._errorCode = error.response.status;
                }
            } else { // 请求发送失败
                error._desc = '网络请求失败';
                error._errorType = 'A';
                error._errorCode = error.message.charCodeAt(0);
            }

            return Promise.reject(error);
        });
    }

    /**
     * 通过拦截器输出请求的错误日志
     */
    _logResponseError() {
        this.axios.interceptors.response.use(undefined, function(error) {
            console.warn(`${error._desc}(${error._errorType}${error._errorCode})`,  
                         error.config.method, error.config.url,
                         error.message,
                         error.config, error.response,
                         error);

            return Promise.reject(error);
        });
    }

    /**
     * 发送请求
     * 
     * @param {AxiosRequestConfig} config 扩展的 AxiosRequestConfig
     * @param {boolean} [config._jsonp]
     * @param {string} [config._jsonpCallback] name of the query string parameter to specify the callback(defaults to `callback`)
     * @return {Promise}
     */
    send(config) {
        var promise = null;

        if (config._jsonp) {
            promise = this._jsonp({
                method: 'get',
                url: config.url,
                params: config.params,
                timeout: config.timeout,
                _jsonpCallback: config._jsonpCallback
            });
        } else {
            promise = this._axios(config);
        }

        return promise;
    }

    /**
     * 通过 JSONP 发送请求
     * 
     * @param {object} config
     * @param {string} config.url
     * @param {object} [config.params]
     * @param {number} [config.timeout]
     * @param {string} [config._jsonpCallback]
     * @return {Promise}
     */
    _jsonp(config) {
        var _timeout = parseInt(config.timeout, 10);
        _timeout = _timeout ? _timeout : this.axios.defaults.timeout;
        var _url = new QsMan(config.url).append(config.params).toString();
        var _jsonpCallback = config._jsonpCallback;

        var promise = new Promise(function(resolve, reject) {
            jsonp(_url, {
                param: _jsonpCallback,
                timeout: _timeout
            }, function(error, data) {
                if (error) { // 返回 AxiosError
                    error.request = 'script';
                    error.response = null;
                    error.config = config;
                    reject(error);
                } else { // 返回 AxiosResponse
                    resolve({
                        data: data,
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: config,
                        request: 'script'
                    });
                }
            });
        });

        // 兼容 axios 的 Interceptors 机制
        // https://github.com/axios/axios/blob/master/lib/core/Axios.js
        // 首先放入发送请求的 promise
        var chain = [promise, undefined];
        // 在链路的前面加入 intercept request
        this.axios.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
            chain.unshift(interceptor.fulfilled, interceptor.rejected);
        });
        // 在链路的后面加入 intercept response
        this.axios.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
            chain.push(interceptor.fulfilled, interceptor.rejected);
        });
        while (chain.length) {
            promise = promise.then(chain.shift(), chain.shift());
        }

        return promise;
    }

    /**
     * 通过 axios 发送请求
     * 
     * @param {AxiosRequestConfig} config
     * @return {Promise}
     */
    _axios(config) {
        // axios promise 链: [...interceptors.request, dispatch request, ...interceptors.response]
        return this.axios(config);
    }

    /**
     * 判断接口调用是否成功
     * 
     * @param {AxiosResponse} response
     * @return {boolean}
     */
    _isApiSuccess(response) {
        var result = response.data;
        return result && (!result.status || result.status === 0);
    }
}

export default StandardHttpClient;