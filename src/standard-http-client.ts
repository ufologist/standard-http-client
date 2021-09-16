import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse
} from 'axios';
import fetchJsonp from 'fetch-jsonp';
import QsMan from 'qsman';

import isAbsoluteURL from './helpers/isAbsoluteURL';
import combineURLs from './helpers/combineURLs';

/**
 * 扩展的 AxiosRequestConfig
 */
interface RequestConfig extends AxiosRequestConfig {
    /**
     * 实现类似 jQuery.ajax 的 data 配置项机制
     */
    _data?: any;

    /**
     * 是否通过 JSONP 来发送请求(注意此时 config 仅支持 baseURL, url, params, timeout, transformResponse 参数)
     */
    _jsonp?: boolean;
    /**
     * name of the query string parameter to specify the callback(defaults to `callback`)
     */
    _jsonpCallback?: string;
}

/**
 * 返回的请求结果
 */
type Response = [data: any, response: AxiosResponse];

/**
 * 符合接口规范的 HTTP 客户端
 * 
 * @see https://github.com/f2e-journey/treasure/blob/master/api.md
 */
class StandardHttpClient {
    /**
     * axios 的实例
     */
    agent: AxiosInstance;

    /**
     * 创建 HTTP 客户端的实例
     * 
     * @param config 
     */
    constructor(config?: AxiosRequestConfig) {
        this.agent = axios.create(config);
        this.useInterceptors();
    }

    /**
     * 使用拦截器
     * 
     * 子类可以继承此方法来添加自己的拦截器
     */
    useInterceptors() {
        this._hook();
        this._isResponseSuccess();
        this._descResponseError();
        this._handleError();
        this._logResponseError();
    }

    /**
     * 通过拦截器判断接口调用是否成功
     */
    private _isResponseSuccess() {
        // @ts-ignore
        this.agent.interceptors.response.use((response: any) => {
            const result = response.data;
            if (this._isApiSuccess(response)) {
                return Promise.resolve([result.data, response]);
            } else {
                let message = '接口调用出错但未提供错误信息';
                if (result && result.statusInfo && result.statusInfo.message) {
                    message = result.statusInfo.message;
                } else if (result && result.message) {
                    message = result.message;
                }

                const error: any = new Error(message);
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
    private _descResponseError() {
        this.agent.interceptors.response.use(undefined, (error) => {
            // 如果 transformResponse 执行异常, 进入到拦截器做错误处理,
            // 此时的 error 是没有 config 的,
            // 因为 transformResponse 是客户端执行的逻辑, 因此认定为客户端处理出错
            if (error.config) {
                const validateStatus = error.config.validateStatus || this.agent.defaults.validateStatus;

                const response = error.response;
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
                    } else { // HTTP 异常
                        error._desc = '网络请求错误';
                        error._errorType = 'H';
                        error._errorNumber = response.status;
                    }
                } else { // 请求发送失败
                    error._desc = '网络请求失败';
                    error._errorType = 'A';
                    error._errorNumber = error.message.charCodeAt(0);
                }
            } else {
                this._descClientError(error);
            }

            // 错误码
            error._errorCode = `${error._errorType}${error._errorNumber}`;

            return Promise.reject(error);
        });
    }

    /**
     * 描述客户端错误
     * 
     * @param {Error} error 
     */
    private _descClientError(error: any) {
        error._desc = '客户端处理出错';
        error._errorType = 'C';
        error._errorNumber = error.message.charCodeAt(0);
        error._errorCode = `${error._errorType}${error._errorNumber}`;
    }

    /**
     * 通过拦截器输出请求的错误日志
     */
    private _logResponseError() {
        this.agent.interceptors.response.use(undefined, function(error) {
            const method = error.config ? error.config.method : undefined;
            const url = error.config ? error.config.url : undefined;

            console.warn(`${error._desc}(${error._errorCode})`,  
                         method, url,
                         error.message,
                         error.config, error.response,
                         error);

            return Promise.reject(error);
        });
    }

    /**
     * 通过拦截器增加发送请求的 hook
     * 
     * ```
     *                     ┌─> 成功 ─> afterSend
     * beforeSend ─> send ─┤
     *                     └─> 失败 ─> afterSend
     * ```
     */
    private _hook() {
        this.agent.interceptors.request.use((config) => {
            this.beforeSend(config);
            return config;
        });

        this.agent.interceptors.response.use((response) => {
            this.afterSend(response);
            return response;
        }, (error) => {
            this.afterSend(error);
            return Promise.reject(error);
        });
    }

    /**
     * 通过拦截器处理请求的错误
     */
    private _handleError() {
        this.agent.interceptors.response.use(undefined, (error) => {
            try {
                this.handleError(error);
            } catch (e: any) {
                e.response = error.response;
                e.request = error.request;
                e.config = error.config;

                this._descClientError(e);
                throw e;
            }
            return Promise.reject(error);
        });
    }

    /**
     * 发送请求之前统一要做的事情
     * 
     * @abstract
     * @param config 
     */
    protected beforeSend(config: AxiosRequestConfig) {}
    /**
     * 请求完成之后统一要做的事情
     * 
     * @abstract
     * @param responseOrError 
     */
    protected afterSend(responseOrError: AxiosResponse | AxiosError) {}
    /**
     * 请求出错之后如何处理错误
     * 
     * @abstract
     * @param error
     */
    protected handleError(error: AxiosError) {}

    /**
     * 发送请求
     * 
     * @param config
     */
    send(config: RequestConfig = {}): Promise<Response> {
        this._adapterDataOption(config);

        let promise = null;
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

        // @ts-ignore
        return promise;
    }

    /**
     * 将 config._data 适配为 config.params 和 config.data
     * 
     * 当为 post/put/patch 请求时会将 config._data 转成 URL 编码的字符串
     * 
     * @param config
     */
    private _adapterDataOption(config: RequestConfig) {
        if (config._data) {
            let method = '';
            if (config.method) {
                method = config.method.toLowerCase();
            }

            // request methods 'PUT', 'POST', and 'PATCH' can send request body
            const hasRequestBodyMethods = ['put', 'post', 'patch'];
            if (hasRequestBodyMethods.indexOf(method) !== -1) {
                // 已有 config.data 时不做任何操作
                if (!config.data) {
                    config.data = typeof config._data === 'object' ?
                                  new QsMan().append(config._data).toString() : config._data;
                }
            } else {
                // 已有 config.params 时不做任何操作
                // XXX axios params 参数对待数组的方式为: a[]=1&a[]=2
                // 而后端传统的方式为 a=1&a=2
                config.params = config.params || config._data;
            }
        }
    }

    /**
     * 通过 JSONP 发送请求
     * 
     * @param config
     */
    private _jsonp(config: RequestConfig): Promise<AxiosResponse> {
        // Support baseURL config
        const baseURL = config.baseURL || this.agent.defaults.baseURL;
        // @ts-ignore
        if (baseURL && !isAbsoluteURL(config.url)) {
            // @ts-ignore
            config.url = combineURLs(baseURL, config.url);
        }

        let url = config.url;
        if (config.params) {
            url = new QsMan(url).append(config.params).toString();
        }

        if (!config.timeout) {
            config.timeout = this.agent.defaults.timeout;
        }

        const transformResponse = config.transformResponse || this.agent.defaults.transformResponse;

        // @ts-ignore
        let promise = fetchJsonp(url, {
            timeout: config.timeout,
            jsonpCallback: config._jsonpCallback
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            // Support transformResponse config
            let _data = data;
            if (transformResponse && Object.prototype.toString.call(transformResponse) === '[object Array]') {
                // @ts-ignore
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
        const chain = [promise, undefined];
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
    }

    /**
     * Dispatch a request to the server.
     * 
     * @param config
     */
    private _dispatchRequest(config: RequestConfig): Promise<AxiosResponse> {
        // axios promise 链: [...interceptors.request, dispatch request, ...interceptors.response]
        return this.agent(config);
    }

    /**
     * 判断接口调用是否成功
     * 
     * @param response
     */
    private _isApiSuccess(response: AxiosResponse): boolean {
        const result = response.data;
        // 判断接口调用是否成功的依据
        // 1. 返回的数据应该是一个 object
        // 2. 要么没有 status 字段, 要么 status 字段等于 0
        return typeof result === 'object'
            && (typeof result.status === 'undefined' || result.status === 0);
    }
}

export default StandardHttpClient;