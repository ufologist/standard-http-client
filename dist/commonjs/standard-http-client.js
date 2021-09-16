"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var axios_1 = (0, tslib_1.__importDefault)(require("axios"));
var fetch_jsonp_1 = (0, tslib_1.__importDefault)(require("fetch-jsonp"));
var qsman_1 = (0, tslib_1.__importDefault)(require("qsman"));
var isAbsoluteURL_1 = (0, tslib_1.__importDefault)(require("./helpers/isAbsoluteURL"));
var combineURLs_1 = (0, tslib_1.__importDefault)(require("./helpers/combineURLs"));
/**
 * 符合接口规范的 HTTP 客户端
 *
 * @see https://github.com/f2e-journey/treasure/blob/master/api.md
 */
var StandardHttpClient = /** @class */ (function () {
    /**
     * 创建 HTTP 客户端的实例
     *
     * @param config
     */
    function StandardHttpClient(config) {
        this.agent = axios_1.default.create(config);
        this.useInterceptors();
    }
    /**
     * 使用拦截器
     *
     * 子类可以继承此方法来添加自己的拦截器
     */
    StandardHttpClient.prototype.useInterceptors = function () {
        this._hook();
        this._isResponseSuccess();
        this._descResponseError();
        this._handleError();
        this._logResponseError();
    };
    /**
     * 通过拦截器判断接口调用是否成功
     */
    StandardHttpClient.prototype._isResponseSuccess = function () {
        var _this = this;
        // @ts-ignore
        this.agent.interceptors.response.use(function (response) {
            var result = response.data;
            if (_this._isApiSuccess(response)) {
                return Promise.resolve([result.data, response]);
            }
            else {
                var message = '接口调用出错但未提供错误信息';
                if (result && result.statusInfo && result.statusInfo.message) {
                    message = result.statusInfo.message;
                }
                else if (result && result.message) {
                    message = result.message;
                }
                var error = new Error(message);
                error.response = response;
                error.request = response.request;
                error.config = response.config;
                return Promise.reject(error);
            }
        });
    };
    /**
     * 通过拦截器描述请求的错误信息
     */
    StandardHttpClient.prototype._descResponseError = function () {
        var _this = this;
        this.agent.interceptors.response.use(undefined, function (error) {
            // 如果 transformResponse 执行异常, 进入到拦截器做错误处理,
            // 此时的 error 是没有 config 的,
            // 因为 transformResponse 是客户端执行的逻辑, 因此认定为客户端处理出错
            if (error.config) {
                var validateStatus = error.config.validateStatus || _this.agent.defaults.validateStatus;
                var response = error.response;
                if (response) { // 请求发送成功, 即前端能够拿到 HTTP 请求返回的数据
                    if (validateStatus && validateStatus(response.status)) { // HTTP 成功, 但接口调用出错
                        // 错误描述
                        error._desc = '接口调用出错';
                        // 错误分类
                        error._errorType = 'B';
                        // 错误编号
                        // 如果接口调用出错但未提供错误编号, 错误编号默认为 0
                        error._errorNumber = response.data && response.data.status ?
                            response.data.status : 0;
                    }
                    else { // HTTP 异常
                        error._desc = '网络请求错误';
                        error._errorType = 'H';
                        error._errorNumber = response.status;
                    }
                }
                else { // 请求发送失败
                    error._desc = '网络请求失败';
                    error._errorType = 'A';
                    error._errorNumber = error.message.charCodeAt(0);
                }
            }
            else {
                _this._descClientError(error);
            }
            // 错误码
            error._errorCode = "" + error._errorType + error._errorNumber;
            return Promise.reject(error);
        });
    };
    /**
     * 描述客户端错误
     *
     * @param {Error} error
     */
    StandardHttpClient.prototype._descClientError = function (error) {
        error._desc = '客户端处理出错';
        error._errorType = 'C';
        error._errorNumber = error.message.charCodeAt(0);
        error._errorCode = "" + error._errorType + error._errorNumber;
    };
    /**
     * 通过拦截器输出请求的错误日志
     */
    StandardHttpClient.prototype._logResponseError = function () {
        this.agent.interceptors.response.use(undefined, function (error) {
            var method = error.config ? error.config.method : undefined;
            var url = error.config ? error.config.url : undefined;
            console.warn(error._desc + "(" + error._errorCode + ")", method, url, error.message, error.config, error.response, error);
            return Promise.reject(error);
        });
    };
    /**
     * 通过拦截器增加发送请求的 hook
     *
     * ```
     *                     ┌─> 成功 ─> afterSend
     * beforeSend ─> send ─┤
     *                     └─> 失败 ─> afterSend
     * ```
     */
    StandardHttpClient.prototype._hook = function () {
        var _this = this;
        this.agent.interceptors.request.use(function (config) {
            _this.beforeSend(config);
            return config;
        });
        this.agent.interceptors.response.use(function (response) {
            _this.afterSend(response);
            return response;
        }, function (error) {
            _this.afterSend(error);
            return Promise.reject(error);
        });
    };
    /**
     * 通过拦截器处理请求的错误
     */
    StandardHttpClient.prototype._handleError = function () {
        var _this = this;
        this.agent.interceptors.response.use(undefined, function (error) {
            try {
                _this.handleError(error);
            }
            catch (e) {
                e.response = error.response;
                e.request = error.request;
                e.config = error.config;
                _this._descClientError(e);
                throw e;
            }
            return Promise.reject(error);
        });
    };
    /**
     * 发送请求之前统一要做的事情
     *
     * @abstract
     * @param config
     */
    StandardHttpClient.prototype.beforeSend = function (config) { };
    /**
     * 请求完成之后统一要做的事情
     *
     * @abstract
     * @param responseOrError
     */
    StandardHttpClient.prototype.afterSend = function (responseOrError) { };
    /**
     * 请求出错之后如何处理错误
     *
     * @abstract
     * @param error
     */
    StandardHttpClient.prototype.handleError = function (error) { };
    /**
     * 发送请求
     *
     * @param config
     */
    StandardHttpClient.prototype.send = function (config) {
        if (config === void 0) { config = {}; }
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
        }
        else {
            promise = this._dispatchRequest(config);
        }
        // @ts-ignore
        return promise;
    };
    /**
     * 将 config._data 适配为 config.params 和 config.data
     *
     * 当为 post/put/patch 请求时会将 config._data 转成 URL 编码的字符串
     *
     * @param config
     */
    StandardHttpClient.prototype._adapterDataOption = function (config) {
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
                        new qsman_1.default().append(config._data).toString() : config._data;
                }
            }
            else {
                // 已有 config.params 时不做任何操作
                // XXX axios params 参数对待数组的方式为: a[]=1&a[]=2
                // 而后端传统的方式为 a=1&a=2
                config.params = config.params || config._data;
            }
        }
    };
    /**
     * 通过 JSONP 发送请求
     *
     * @param config
     */
    StandardHttpClient.prototype._jsonp = function (config) {
        // Support baseURL config
        var baseURL = config.baseURL || this.agent.defaults.baseURL;
        // @ts-ignore
        if (baseURL && !(0, isAbsoluteURL_1.default)(config.url)) {
            // @ts-ignore
            config.url = (0, combineURLs_1.default)(baseURL, config.url);
        }
        var url = config.url;
        if (config.params) {
            url = new qsman_1.default(url).append(config.params).toString();
        }
        if (!config.timeout) {
            config.timeout = this.agent.defaults.timeout;
        }
        var transformResponse = config.transformResponse || this.agent.defaults.transformResponse;
        // @ts-ignore
        var promise = (0, fetch_jsonp_1.default)(url, {
            timeout: config.timeout,
            jsonpCallback: config._jsonpCallback
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            // Support transformResponse config
            var _data = data;
            if (transformResponse && Object.prototype.toString.call(transformResponse) === '[object Array]') {
                // @ts-ignore
                transformResponse.forEach(function (fn) {
                    _data = fn(_data);
                });
            }
            return Promise.resolve({
                data: _data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config,
                request: 'script'
            });
        }).catch(function (error) {
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
        // @ts-ignore
        this.agent.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
            chain.unshift(interceptor.fulfilled, interceptor.rejected);
        });
        // 在链路的后面加入 intercept response
        // @ts-ignore
        this.agent.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
            chain.push(interceptor.fulfilled, interceptor.rejected);
        });
        while (chain.length) {
            // @ts-ignore
            promise = promise.then(chain.shift(), chain.shift());
        }
        return promise;
    };
    /**
     * Dispatch a request to the server.
     *
     * @param config
     */
    StandardHttpClient.prototype._dispatchRequest = function (config) {
        // axios promise 链: [...interceptors.request, dispatch request, ...interceptors.response]
        return this.agent(config);
    };
    /**
     * 判断接口调用是否成功
     *
     * @param response
     */
    StandardHttpClient.prototype._isApiSuccess = function (response) {
        var result = response.data;
        // 判断接口调用是否成功的依据
        // 1. 返回的数据应该是一个 object
        // 2. 要么没有 status 字段, 要么 status 字段等于 0
        return typeof result === 'object'
            && (typeof result.status === 'undefined' || result.status === 0);
    };
    return StandardHttpClient;
}());
exports.default = StandardHttpClient;
