import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
/**
 * 扩展的 AxiosRequestConfig
 */
export interface RequestConfig extends AxiosRequestConfig {
    /**
     * 实现类似 jQuery.ajax 的 data 配置项机制
     */
    _data?: any;
    /**
     * 是否拦截重复请求
     */
    _interceptDuplicateRequest?: boolean;
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
 * 错误分类
 */
declare type ErrorType = 'H' | 'B' | 'A' | 'C';
/**
 * 扩展的 AxiosError
 */
export interface RequestError extends AxiosError {
    /**
     * 错误分类的描述, 例如: 接口调用出错
     */
    _desc?: string;
    /**
     * 错误分类, 例如: H
     */
    _errorType?: ErrorType;
    /**
     * 错误编号, 例如: 404
     */
    _errorNumber?: string | number;
    /**
     * 错误码, 例如: H404
     */
    _errorCode?: string;
}
/**
 * 返回的请求结果
 */
declare type Response = [data: any, response: AxiosResponse];
/**
 * 符合接口规范的 HTTP 客户端
 *
 * @see https://github.com/f2e-journey/treasure/blob/master/api.md
 */
declare class StandardHttpClient {
    /**
     * axios 的实例
     */
    agent: AxiosInstance;
    /**
     * 每个发送的请求都加入到队列中, 用于拦截重复请求
     *
     * 存储的数据结构为
     *
     * ```
     * const requestFingerprint = fingerprint(`
     *     ${RequestConfig.method}
     *     ${RequestConfig.url}
     *     ${RequestConfig.params || RequestConfig.data}
     * `);
     * {
     *     requestFingerprint: RequestConfig
     * }
     * ```
     */
    private _requestQueue;
    /**
     * 创建 HTTP 客户端的实例
     *
     * @param config
     */
    constructor(config?: AxiosRequestConfig);
    /**
     * 使用拦截器
     *
     * 子类可以继承此方法来添加自己的拦截器
     */
    useInterceptors(): void;
    /**
     * 通过拦截器判断接口调用是否成功
     */
    private _isResponseSuccess;
    /**
     * 通过拦截器描述请求的错误信息
     */
    private _descResponseError;
    /**
     * 描述客户端错误
     *
     * @param error
     */
    private _descClientError;
    /**
     * 描述请求错误
     *
     * @param error
     */
    private _descRequestError;
    /**
     * 通过拦截器输出请求的错误日志
     */
    private _logResponseError;
    /**
     * 通过拦截器增加发送请求的 hook
     *
     * ```
     *                     ┌─> 成功 ─> afterSend
     * beforeSend ─> send ─┤
     *                     └─> 失败 ─> afterSend
     * ```
     */
    private _hook;
    /**
     * 通过拦截器处理请求的错误
     */
    private _handleError;
    /**
     * 发送请求之前统一要做的事情
     *
     * @abstract
     * @param config
     */
    protected beforeSend(config: AxiosRequestConfig): void;
    /**
     * 请求完成之后统一要做的事情
     *
     * @abstract
     * @param responseOrError
     */
    protected afterSend(responseOrError: AxiosResponse | RequestError): void;
    /**
     * 请求出错之后如何处理错误
     *
     * @abstract
     * @param error
     */
    protected handleError(error: RequestError): void;
    /**
     * 发送请求
     *
     * @param config
     */
    send(config?: RequestConfig): Promise<Response>;
    /**
     * 将 config._data 适配为 config.params 和 config.data
     *
     * 当为 post/put/patch 请求时会将 config._data 转成 URL 编码的字符串
     *
     * @param config
     */
    private _adapterDataOption;
    /**
     * 获取请求的指纹特征
     *
     * @param config
     * @returns
     */
    private _getRequestFingerprint;
    /**
     * 判定是否为重复请求
     *
     * @param config
     */
    private _isDuplicateRequest;
    /**
     * 将请求加入到队列中
     *
     * @param config
     */
    private _addRequestToQueue;
    /**
     * 将请求从队列中移除
     *
     * @param config
     */
    private _removeRequestFromQueue;
    /**
     * 通过 JSONP 发送请求
     *
     * @param config
     */
    private _jsonp;
    /**
     * Dispatch a request to the server.
     *
     * @param config
     */
    private _dispatchRequest;
    /**
     * 判断接口调用是否成功
     *
     * @param response
     */
    private _isApiSuccess;
}
export default StandardHttpClient;
