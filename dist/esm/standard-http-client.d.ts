import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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
    _isResponseSuccess(): void;
    /**
     * 通过拦截器描述请求的错误信息
     */
    _descResponseError(): void;
    /**
     * 描述客户端错误
     *
     * @param {Error} error
     */
    _descClientError(error: any): void;
    /**
     * 通过拦截器输出请求的错误日志
     */
    _logResponseError(): void;
    /**
     * 通过拦截器增加发送请求的 hook
     *
     * ```
     *                     ┌─> 成功 ─> afterSend
     * beforeSend ─> send ─┤
     *                     └─> 失败 ─> afterSend
     * ```
     */
    _hook(): void;
    /**
     * 通过拦截器处理请求的错误
     */
    _handleError(): void;
    /**
     * 发送请求之前统一要做的事情
     *
     * @abstract
     * @param config
     */
    beforeSend(config: AxiosRequestConfig): void;
    /**
     * 请求完成之后统一要做的事情
     *
     * @abstract
     * @param responseOrError
     */
    afterSend(responseOrError: AxiosResponse | AxiosError): void;
    /**
     * 请求出错之后如何处理错误
     *
     * @abstract
     * @param error
     */
    handleError(error: AxiosError): void;
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
    _adapterDataOption(config: RequestConfig): void;
    /**
     * 通过 JSONP 发送请求
     *
     * @param config
     */
    _jsonp(config: RequestConfig): Promise<AxiosResponse>;
    /**
     * Dispatch a request to the server.
     *
     * @param config
     */
    _dispatchRequest(config: RequestConfig): Promise<AxiosResponse>;
    /**
     * 判断接口调用是否成功
     *
     * @param response
     */
    _isApiSuccess(response: AxiosResponse): boolean;
}
export default StandardHttpClient;
