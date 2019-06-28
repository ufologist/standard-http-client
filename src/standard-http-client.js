import axios from 'axios';
import fetchJsonp from 'fetch-jsonp';
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
     * 通过拦截器处理接口调用是否成功
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
     * 通过拦截器描述请求的错误
     */
    _descResponseError() {
        this.agent.interceptors.response.use(undefined, (error) => {
            var response = error.response;
            if (response) { // 请求发送成功
                if (!this._isApiSuccess(response)) { // 接口调用出错
                    // 错误描述
                    error._desc = '接口调用出错';
                    // 错误分类
                    error._errorType = 'B';
                    // 错误码
                    // 如果接口调用出错但未提供错误码, 错误码默认为 0
                    error._errorCode = response.data && response.data.status ?
                                       response.data.status : 0;
                } else { // HTTP 请求错误
                    error._desc = '网络请求错误';
                    error._errorType = 'H';
                    error._errorCode = response.status;
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
        this.agent.interceptors.response.use(undefined, function(error) {
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
            promise = this._dispatchRequest(config);
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
        _timeout = _timeout ? _timeout : this.agent.defaults.timeout;

        var _url = new QsMan(config.url).append(config.params).toString();
        var _jsonpCallback = config._jsonpCallback;

        var promise = fetchJsonp(_url, {
            timeout: _timeout,
            jsonpCallback: _jsonpCallback
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            return Promise.resolve({ // 返回 AxiosResponse
                data: data,
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
        return typeof result === 'object' && (!result.status || result.status === 0);
    }
}

export default StandardHttpClient;