# standard-http-client

[![NPM version][npm-image]][npm-url] [![Build Status][ci-status-image]][ci-status-url] [![Coverage Status][coverage-status-image]][coverage-status-url] [![Known Vulnerabilities][vulnerabilities-status-image]][vulnerabilities-status-url] [![changelog][changelog-image]][changelog-url] [![license][license-image]][license-url]

[vulnerabilities-status-image]: https://snyk.io/test/npm/standard-http-client/badge.svg
[vulnerabilities-status-url]: https://snyk.io/test/npm/standard-http-client
[ci-status-image]: https://travis-ci.org/ufologist/standard-http-client.svg?branch=master
[ci-status-url]: https://travis-ci.org/ufologist/standard-http-client
[coverage-status-image]: https://coveralls.io/repos/github/ufologist/standard-http-client/badge.svg?branch=master
[coverage-status-url]: https://coveralls.io/github/ufologist/standard-http-client
[npm-image]: https://img.shields.io/npm/v/standard-http-client.svg?style=flat-square
[npm-url]: https://npmjs.org/package/standard-http-client
[license-image]: https://img.shields.io/github/license/ufologist/standard-http-client.svg
[license-url]: https://github.com/ufologist/standard-http-client/blob/master/LICENSE
[changelog-image]: https://img.shields.io/badge/CHANGE-LOG-blue.svg?style=flat-square
[changelog-url]: https://github.com/ufologist/standard-http-client/blob/master/CHANGELOG.md

[![npm-image](https://nodei.co/npm/standard-http-client.png?downloads=true&downloadRank=true&stars=true)](https://npmjs.com/package/standard-http-client)

符合[接口规范](https://github.com/f2e-journey/treasure/blob/master/api.md)的 HTTP 客户端(基于 [axios](https://github.com/axios/axios))

## 功能

### 主要功能
* 遵循[接口规范](https://github.com/f2e-journey/treasure/blob/master/api.md), 当接口调用成功时才会执行 `resolve`, `resolve` 时可以便捷地获取到接口规范中的业务数据
* 规范化请求的错误处理, 生成标准的错误码, 并输出错误日志
  * `error._desc` 错误分类的描述, 例如: `接口调用出错`
  * `error._errorType` 错误分类, 例如: `H`
  * `error._errorNumber` 错误编号, 例如: `404`
  * `error._errorCode` 错误码, 例如: `H404`
* 预留扩展机制, 便于实现定制需求(例如统一开启/关闭 loading)

### 次要功能
* 扩展 axios 的配置项 `_jsonp`: 通过 JSONP 机制发送请求, 并支持和 axios 兼容的参数和拦截器
* 扩展 axios 的配置项 `_data`: 实现类似 [jQuery.ajax 的 data 配置项机制](https://api.jquery.com/jQuery.ajax/)
  * `GET` 请求时, 适配到 axios 的 `params` 配置项上
  * `POST/PUT/PATCH` 请求时, 将对象转成 `form-urlencoded` 的字符串, 适配到 axios 的 `data` 配置项上
  * PS: 针对其他情况, 例如需要传 `JSON` 数据时, 请使用 axios 原有的 `data` 配置项
* 扩展 axios 的配置项 `_interceptDuplicateRequest`: 可拦截重复请求

## 示例

### 发送请求
```javascript
import StandardHttpClient from 'standard-http-client';

var httpClient = new StandardHttpClient({ // instance axios Request Config
    withCredentials: true,
    timeout: 10000
});

httpClient.send({ // axios Request Config
    url: 'https://domain.com/path/to/api'
}).then(function([data, response]) {
    // 注意: 这里的 data 是接口规范中的 data 字段, 即接口返回的业务数据
    console.log(data);
});

httpClient.send({
    url: 'https://domain.com/path/to/api',
    // 拦截重复请求
    _interceptDuplicateRequest: true
}).then(function([data, response]) {
    console.log(data);
});

// 通过 JSONP 发送请求
httpClient.send({
    url: 'https://domain.com/path/to/api',
    _jsonp: true
}).then(function([data, response]) {
    console.log(data);
});

// 通过 _data 发送数据更便捷
httpClient.send({
    url: 'https://domain.com/path/to/api',
    _data: {
        foo: 'bar'
    }
}).then(function([data, response]) {
    console.log(data);
});

// 如果调用的接口不符合接口规范, 可以通过 transformResponse 机制适配接口数据以符合接口规范
httpClient.send({
    url: 'https://domain.com/path/to/api',
    transformResponse: [function(data) {
        // 注意这里的 data 是原始数据, 即大部分情况都是 string 类型
        // axios 默认的 transformResponse 是对 data 做了 JSON.parse
        var _data = JSON.parse(data);

        var standardData = {
            status: 0,
            data: null,
            statusInfo: {
                message: '',
                detail: ''
            }
        };

        standardData.status = _data.code;
        standardData.data = _data.res;
        standardData.statusInfo.message = _data.message;

        return standardData;
    }]
}).then(function([data, response]) {
    console.log(data);
});
```

### hook 机制

```javascript
import StandardHttpClient from 'standard-http-client';

class HttpClient extends StandardHttpClient {
    constructor(config) {
        super(config);
    }

    beforeSend(config) {
        console.log('before send', config);
    }
    afterSend(responseOrError) {
        console.log('after send', responseOrError);
    }
    handleError(error) {
        console.log('handle error', error);
    }
}

var httpClient = new HttpClient({ // instance axios Request Config
    withCredentials: true,
    timeout: 10000
});

httpClient.send({ // axios Request Config
    url: 'https://domain.com/path/to/api'
}).then(function([data, response]) {
    console.log(data);
});
```

参考实现: [shc-pc](https://github.com/ufologist/shc-pc)

### 扩展拦截器

```javascript
import StandardHttpClient from 'standard-http-client';

class HttpClient extends StandardHttpClient {
    constructor(config) {
        super(config);
    }
    useInterceptors() {
        super.useInterceptors();

        // this.agent is an instance of axios
        this.agent.interceptors.request.use(function(config) {
            console.log('HttpClient request config', config);
            return config;
        }, function (error) {
            console.log('HttpClient request error', error);
            return Promise.reject(error);
        });

        this.agent.interceptors.response.use(function(response) {
            console.log('HttpClient response', response);
            return response;
        }, function(error) {
            console.log('HttpClient response error', error);
            return Promise.reject(error);
        });
    }
}

var httpClient = new HttpClient({ // instance axios Request Config
    withCredentials: true,
    timeout: 10000
});

httpClient.send({ // axios Request Config
    url: 'https://domain.com/path/to/api'
}).then(function([data, response]) {
    console.log(data);
});
```

详见 [API 文档](https://doc.esdoc.org/github.com/ufologist/standard-http-client)