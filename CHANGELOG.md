# CHANGELOG

* v1.0.0 2021-9-16

  * refactor: 重构为 TS

* v0.0.5 2020-7-21

  * feat: 兼容返回的数据中直接使用 message 字段作为提示

* v0.0.4 2019-8-26

  * fix: 升级 `qsman@0.0.4`, 解决使用 `_data` 时, 如果要编码的数据包含 `%` 就会报错

* v0.0.3 2019-7-4

  * 去掉 `_hook` 中的 `try/catch`
  * 修改 `_hook` 为第一个拦截器, 这样即使 `_hook` 中出现异常也可以被后面的拦截器捕获到异常

* v0.0.2 2019-7-3

  * 新增 `_errorNumber` 字段用于放置错误编号(例如: `404`)
  * **修改 `_errorCode` 字段用于放置错误码(例如: `H404`), 原来放置的是错误编号**
  * 通过拦截器增加发送请求的 hook(`beforeSend`, `afterSend`, `handleError`)

* v0.0.1 2019-6-29

  * 初始版本
  
  ## 如何选择一个合适的 JSONP 库
  * 需要有哪些必备功能
    * timeout option
    * callback option
    * auto generate template jsonp callback function
    * handle onerror
    * cleanup
      * timeout task
      * template jsonp callback function
      * script tag
  * 备选
    * https://github.com/camsong/fetch-jsonp 没有测试用例
    * https://github.com/brandonjpierce/b-jsonp 没有删除 script 元素
  * 不合适
    * https://github.com/webmodules/jsonp 没有监听 onerror, 依赖了 `debug` 包, 有点累赘

      > 特别注意, 这个是 [axios 官方引导的包](https://github.com/axios/axios/blob/master/COOKBOOK.md#jsonp), 但不太合适
    * https://github.com/estrattonbailey/micro-jsonp 去掉了 debug 包, 但没有监听 onerror
    * https://github.com/lbwa/jsonp 处理了 onerror, 但缺少测试用例, jsonpCallback 传入空字符串会有问题
    * https://github.com/larryosborn/JSONP 太久没更新了, 还是 CoffeeScript
    * https://github.com/jeremenichelli/cormoran URL 中本身包含参数是有 bug
    * https://github.com/jeremenichelli/jabiru 和上面这个包基本上一致
    * https://github.com/kthjm/jsonp-simple 不支持修改 callback 参数
    * https://github.com/bermi/jsonp-client 尽然需要自己指定 callback
    * https://github.com/blearjs/blear.core.jsonp 代码质量很高, 但依赖有点多
    * https://github.com/iDerekLi/http-jsonp 还可以加载 JS, 但缺少测试用例
    * https://github.com/borodean/jsonp 不支持 timeout
    * https://github.com/lazycoffee/lc-jsonp 不支持 timeout
    * https://github.com/DigitalBrainJS/safe-jsonp 竟然支持在沙盒(iframe)中执行 JSONP
    * https://github.com/bloodyowl/jsonp timeout 时没有清理临时方法
    * https://github.com/wendzhue/pjsonp 没有监听 onerror