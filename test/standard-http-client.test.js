import 'babel-polyfill';

import StandardHttpClient from '../src/standard-http-client.js'

// TODO JSONP 测试不了
describe('发送 HTTP 请求', function() {
    test('发送成功', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            url: 'http://localhost:8000/api'
        });
        expect(response).not.toBeNull();
    });

    test('发送失败', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(5);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                timeout: 1
            });
        } catch (error) {
            expect(error.response).toBeUndefined();

            expect(error._desc).toBe('网络请求失败');
            expect(error._errorType).toBe('A');
            expect(error._errorNumber).not.toBeNull();
            expect(error._errorCode.charAt(0)).toBe('A');
        }
    });
});

describe('发送成功', function() {
    test('HTTP 成功', async () => {
        var shc = new StandardHttpClient();
        var [data, response] = await shc.send({
            url: 'http://localhost:8000/api'
        });
        expect(response.status).toBe(200);
    });

    test('HTTP 异常', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(7);
        try {
            await shc.send({
                url: 'http://localhost:8000/api-404'
            });
        } catch (error) {
            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error._desc).toBe('网络请求错误');
            expect(error._errorType).toBe('H');
            expect(error._errorNumber).toBe(404);
            expect(error._errorCode).toBe('H404');
        }
    });
});

describe('接口调用', function() {
    test('成功', async () => {
        var shc = new StandardHttpClient();
        var [data] = await shc.send({
            url: 'http://localhost:8000/api'
        });
        expect(data).toBe('data');
    });

    test('成功-带默认配置', async () => {
        var shc = new StandardHttpClient({
            baseURL: 'http://localhost:8000'
        });
        var [data] = await shc.send({
            url: '/api'
        });
        expect(data).toBe('data');
    });

    test('没有返回接口规范的数据格式', async () => {
        var shc = new StandardHttpClient();

        expect.assertions(8);
        try {
            await shc.send({
                url: 'http://localhost:8000/api-response-not-standard'
            });
        } catch (error) {
            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error.message).toBe('接口调用出错但未提供错误信息');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(0);
            expect(error._errorCode).toBe('B0');
        }
    });

    test('失败-没有提供错误信息', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(8);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                params: {
                    status: 1
                }
            });
        } catch (error) {
            expect(error.response).not.toBeNull();
            expect(error.request).not.toBeNull();
            expect(error.config).not.toBeNull();

            expect(error.message).toBe('接口调用出错但未提供错误信息');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(1);
            expect(error._errorCode).toBe('B1');
        }
    });

    test('失败-提供了错误信息', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(5);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                params: {
                    status: 2,
                    message: '接口调用失败了'
                }
            });
        } catch (error) {
            expect(error.message).toBe('接口调用失败了');
            expect(error._desc).toBe('接口调用出错');
            expect(error._errorType).toBe('B');
            expect(error._errorNumber).toBe(2);
            expect(error._errorCode).toBe('B2');
        }
    });

    test('客户端处理出错', async () => {
        var shc = new StandardHttpClient();
        expect.assertions(4);
        try {
            await shc.send({
                url: 'http://localhost:8000/api',
                transformResponse: [function(data) {
                    console.log(a.b);
                    return data;
                }]
            });
        } catch (error) {
            expect(error._desc).toBe('客户端处理出错');
            expect(error._errorType).toBe('C');
            expect(error._errorNumber).not.toBeNull();
            expect(error._errorCode.charAt(0)).toBe('C');
        }
    });
});