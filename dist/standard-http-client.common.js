'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var axios = _interopDefault(require('axios'));
var fetchJsonp = _interopDefault(require('fetch-jsonp'));
var QsMan = _interopDefault(require('qsman'));

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

// axios/lib/helpers/isAbsoluteURL.js

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
}

// axios/lib/helpers/combineURLs.js

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '') : baseURL;
}

/**
 * 符合接口规范的 HTTP 客户端
 * 
 * @see https://github.com/f2e-journey/treasure/blob/master/api.md
 */

var StandardHttpClient =
/*#__PURE__*/
function () {
  /**
   * @param {AxiosRequestConfig} config
   */
  function StandardHttpClient(config) {
    _classCallCheck(this, StandardHttpClient);

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


  _createClass(StandardHttpClient, [{
    key: "useInterceptors",
    value: function useInterceptors() {
      this._hook();

      this._isResponseSuccess();

      this._descResponseError();

      this._handleError();

      this._logResponseError();
    }
    /**
     * 通过拦截器判断接口调用是否成功
     */

  }, {
    key: "_isResponseSuccess",
    value: function _isResponseSuccess() {
      var _this = this;

      this.agent.interceptors.response.use(function (response) {
        var result = response.data;

        if (_this._isApiSuccess(response)) {
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

  }, {
    key: "_descResponseError",
    value: function _descResponseError() {
      var _this2 = this;

      this.agent.interceptors.response.use(undefined, function (error) {
        // 如果 transformResponse 执行异常, 进入到拦截器做错误处理,
        // 此时的 error 是没有 config 的,
        // 因为 transformResponse 是客户端执行的逻辑, 因此认定为客户端处理出错
        if (error.config) {
          var validateStatus = error.config.validateStatus || _this2.agent.defaults.validateStatus;
          var response = error.response;

          if (response) {
            // 请求发送成功, 即前端能够拿到 HTTP 请求返回的数据
            if (validateStatus && validateStatus(response.status)) {
              // HTTP 成功, 但接口调用出错
              // 错误描述
              error._desc = '接口调用出错'; // 错误分类

              error._errorType = 'B'; // 错误编号
              // 如果接口调用出错但未提供错误编号, 错误编号默认为 0

              error._errorNumber = response.data && response.data.status ? response.data.status : 0;
            } else {
              // HTTP 异常
              error._desc = '网络请求错误';
              error._errorType = 'H';
              error._errorNumber = response.status;
            }
          } else {
            // 请求发送失败
            error._desc = '网络请求失败';
            error._errorType = 'A';
            error._errorNumber = error.message.charCodeAt(0);
          }
        } else {
          _this2._descClientError(error);
        } // 错误码


        error._errorCode = "".concat(error._errorType).concat(error._errorNumber);
        return Promise.reject(error);
      });
    }
    /**
     * 描述客户端错误
     * 
     * @param {Error} error 
     */

  }, {
    key: "_descClientError",
    value: function _descClientError(error) {
      error._desc = '客户端处理出错';
      error._errorType = 'C';
      error._errorNumber = error.message.charCodeAt(0);
      error._errorCode = "".concat(error._errorType).concat(error._errorNumber);
    }
    /**
     * 通过拦截器输出请求的错误日志
     */

  }, {
    key: "_logResponseError",
    value: function _logResponseError() {
      this.agent.interceptors.response.use(undefined, function (error) {
        var method = error.config ? error.config.method : undefined;
        var url = error.config ? error.config.url : undefined;
        console.warn("".concat(error._desc, "(").concat(error._errorCode, ")"), method, url, error.message, error.config, error.response, error);
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

  }, {
    key: "_hook",
    value: function _hook() {
      var _this3 = this;

      this.agent.interceptors.request.use(function (config) {
        _this3.beforeSend(config);

        return config;
      });
      this.agent.interceptors.response.use(function (response) {
        _this3.afterSend(response);

        return response;
      }, function (error) {
        _this3.afterSend(error);

        return Promise.reject(error);
      });
    }
    /**
     * 通过拦截器处理请求的错误
     */

  }, {
    key: "_handleError",
    value: function _handleError() {
      var _this4 = this;

      this.agent.interceptors.response.use(undefined, function (error) {
        try {
          _this4.handleError(error);
        } catch (e) {
          e.response = error.response;
          e.request = error.request;
          e.config = error.config;

          _this4._descClientError(e);

          throw e;
        }

        return Promise.reject(error);
      });
    }
    /**
     * 发送请求之前统一要做的事情
     * 
     * @abstract
     * @param {AxiosRequestConfig} config 
     */

  }, {
    key: "beforeSend",
    value: function beforeSend(config) {}
    /**
     * 发送请求之后统一要做的事情
     * 
     * @abstract
     * @param {AxiosResponse | AxiosError} responseOrError 
     */

  }, {
    key: "afterSend",
    value: function afterSend(responseOrError) {}
    /**
     * 请求出错之后如何处理错误
     * 
     * @abstract
     * @param {AxiosError} error
     */

  }, {
    key: "handleError",
    value: function handleError(error) {}
    /**
     * 发送请求
     * 
     * @param {AxiosRequestConfig} [config={}] 扩展的 AxiosRequestConfig
     * @param {object} [config._data] 实现类似 jQuery.ajax 的 data 配置项机制
     * @param {boolean} [config._jsonp] 是否通过 JSONP 来发送请求(注意此时 config 仅支持 baseURL, url, params, timeout, transformResponse 参数)
     * @param {string} [config._jsonpCallback] name of the query string parameter to specify the callback(defaults to `callback`)
     * @return {Promise}
     */

  }, {
    key: "send",
    value: function send() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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

  }, {
    key: "_adapterDataOption",
    value: function _adapterDataOption(config) {
      if (config._data) {
        var method = '';

        if (config.method) {
          method = config.method.toLowerCase();
        } // request methods 'PUT', 'POST', and 'PATCH' can send request body


        var hasRequestBodyMethods = ['put', 'post', 'patch'];

        if (hasRequestBodyMethods.indexOf(method) !== -1) {
          // 已有 config.data 时不做任何操作
          if (!config.data) {
            config.data = _typeof(config._data) === 'object' ? new QsMan().append(config._data).toString() : config._data;
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

  }, {
    key: "_jsonp",
    value: function _jsonp(config) {
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
      }).then(function (response) {
        return response.json();
      }).then(function (data) {
        // Support transformResponse config
        var _data = data;

        if (transformResponse && Object.prototype.toString.call(transformResponse) === '[object Array]') {
          transformResponse.forEach(function (fn) {
            _data = fn(_data);
          });
        }

        return Promise.resolve({
          // 返回 AxiosResponse
          data: _data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config,
          request: 'script'
        });
      })["catch"](function (error) {
        // 返回 AxiosError
        error.request = 'script';
        error.response = null;
        error.config = config;
        return Promise.reject(error);
      }); // 兼容 axios 的 Interceptors 机制
      // https://github.com/axios/axios/blob/master/lib/core/Axios.js
      // 首先放入发送请求的 promise

      var chain = [promise, undefined]; // 在链路的前面加入 intercept request

      this.agent.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      }); // 在链路的后面加入 intercept response

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

  }, {
    key: "_dispatchRequest",
    value: function _dispatchRequest(config) {
      // axios promise 链: [...interceptors.request, dispatch request, ...interceptors.response]
      return this.agent(config);
    }
    /**
     * 判断接口调用是否成功
     * 
     * @param {AxiosResponse} response
     * @return {boolean}
     */

  }, {
    key: "_isApiSuccess",
    value: function _isApiSuccess(response) {
      var result = response.data; // 判断接口调用是否成功的依据
      // 1. 返回的数据应该是一个 object
      // 2. 要么没有 status 字段, 要么 status 字段等于 0

      return _typeof(result) === 'object' && (typeof result.status === 'undefined' || result.status === 0);
    }
  }]);

  return StandardHttpClient;
}();

module.exports = StandardHttpClient;
