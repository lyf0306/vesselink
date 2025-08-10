// app.js
import util from './utils/util'

App({
/**
 * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
 */
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 登录
    // 如果本地缓存存在用户信息，则说明用户已授权登录，如果不存在则弹窗提示登陆并跳转到登录界面
    // 这里是没有缓存用户信息，跳转到登陆页面
    if(wx.getStorageSync('token') == "") {
        // 官方bug：页面跳转后全部点击事件失效
        // 解决方案：给reLaunch和reDirect加上定时延迟
        setTimeout(()=>{
            wx.reLaunch({
                url:'/pages/login/login',
            })
        },300)
    } else {
        setTimeout(()=>{
            wx.switchTab({
                url: '/pages/login/login',
            })
        },300)
    }

  },
  globalData: {
    userInfo: null,
    protocol: "https",
    // ip: "47.116.193.81",
    //以后切回ip:port格式也在host里改
    //启用域名校验：https://ericwvi.site/bgmp/...  不能带端口号
    //不启用域名校验：http://ip:port/bgmp/...
    host: "bgmp.ericwvi.site",
    port: "443",
    domainName: null

  },
  // 浏览器ip地址
  serverpath: "http://jsonplaceholder.typicode.com",
  request: function (url, data, success, fail, optionnew) {
      var option = {
        url: this.serverpath + url,
        data: data,
        success: success,
        fail: fail
      };
      if(fail == undefined) {
          fail = function () {}
      } else {
          if (typeof(fail) == "object") {
              option = this.mergeParam(option, fail);
              fail = function() {}
          } else {
              if (optionnew != undefined) {
                  option = this.mergeParam(option, optionnew);
              }
          }
      }
      wx.request(option)
  },
  mergeParam: function (option, noption) {
      for (var key in noption) {
          option[key] = noption[key]
      }
      return option;
  }
})
