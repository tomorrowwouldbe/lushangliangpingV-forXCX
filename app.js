//app.js
var util = require('md5.js')
App({
  onLaunch: function () {
    // this.resetSession()
    var res = wx.getSystemInfoSync()
    console.log(res.SDKVersion)
    var SDKVersionArr = res.SDKVersion.split('.')
    //当 "调试基础库" 低于1.9.1,提示更新
    if (SDKVersionArr[0] == 1 && SDKVersionArr[1] <= 9 && SDKVersionArr[2] < 1){
      wx.showModal({
        title: '提示',
        showCancel:false,
        content: '当前微信版本偏低，无法正常使用我们的小程序，请升级到最新微信版本后重试。',
        success: function (res) {
          if (res.confirm) {
            wx.navigateBack({
              delta:10
            })
          }
        }
      })
    }
  },

  resetSession(fn,isTrue){//重置session_id
    var d = this.globalData, that = this
    //登录
    wx.login({
      success: res => {
        var code = res.code
        that.globalData.code = res.code
        wx.getUserInfo({
          success: function (res) {
            console.log(res)
            that.globalData.accredit = true
            //设置全局变量 个人签名
            that.globalData.userInfo_signature = res.signature
            wx.setStorageSync('userInfo', res.userInfo)
            //获取 用户信息
            wx.request({
              url: that.globalData.link_origin + 'index_api/get_user',
              data: {
                token: that.DP({ code: code, sign: res.signature }),
                code: code,
                sign: res.signature
              },
              header: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              method: 'POST',
              success: function (res) {
                if (res.data.status == 1000) {
                  //设置缓存
                  wx.setStorageSync('lushang_userInfo', res.data.data)
                  wx.setStorageSync('session_id', res.data.data.session_id)
                  if (typeof fn == "function")
                    fn(isTrue) 
                } else {
                  that.showModal('服务器错误，请手动退出，并联系我们！')
                }
              }
            })
          },
          fail(res) {
            console.log(res)
            that.globalData.accredit=false
            wx.clearStorageSync()
            if (typeof fn == "function")
              fn(isTrue)
          }
        })
      }
    })
  },

  req(url, data, cb) {
    var that=this
    wx.request({
      url: that.globalData.link_origin + url,
      data: data,
      method: 'post',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      success: function (res) {
        return typeof cb == "function" && cb(res.data)
      },
      fail: function () {
        that.showModal('请求超时！')
      }
    })
  },

  numberParse(num){
    num=String(num)
    if(num.indexOf('.')>-1){
      return num.split('.').join('')
    }else{
      return num*100
    }
  },

  DP(arys) {//数据处理：先排序拼接成字符串，再md5加密
    // var arr = []
    // for (var i in data) {
    //   arr.push(i + '+' + data[i])
    // }
    // arr.sort()
    // console.log(arr.join('+'))
    // return util.hexMD5(arr.join('+'))
    var aaa=this.objKeySort(arys)
    var b=this.get_token(aaa)
    return b
  },
  objKeySort(arys) {
    var newkey = Object.keys(arys).sort();
    var newObj = {};
    for (var i = 0; i < newkey.length; i++) {
      newObj[newkey[i]] = arys[newkey[i]];
    }
    return newObj; 
  },
  get_token(arys) {
    var str = '';
    for (var key in arys) {
      str += key + "+" + arys[key] + '+';
    }
    str = str.substr(0, str.length - 1);
    var token = util.hexMD5(str);
    return token;
  },

  trim(str){//去除首尾空格
    return str.replace(/^\s+|\s+$/ig, '')
  },

  share(res, title, path){//分享
    if (res.from === 'button') {
      console.log(res.target)
    }
    console.log(path)
    return {
      title: title,
      path: path,
      success: function (res) {},
      fail: function (res) {}
    }
  },

  transferTime(time) {//时间戳转化
    var a = new Date(time*1000),
      b = a.toLocaleDateString(),
      c = a.toLocaleTimeString()
    if(b.indexOf('年')>-1){
      b = b.replace(/年/g, '-')
      b = b.replace(/月/g, '-')
      b = b.replace(/日/g, '')
    }else{
      b = b.replace(/\//g, '-')
    }
    return b + ' ' + c
  },

  showModal(str,fn){//温馨提示
    if (str.length>0){
      if (arguments.length == 1) {
        wx.showToast({
          title: String(str),
          icon: 'none',
          duration: 2000
        })
      } else {
        wx.showModal({
          title: '温馨提示',
          content: String(str),
          showCancel: false,
          confirmColor: '#cf2122',
          success: function (res) {
            if (res.confirm) {
              if (typeof fn == "function")
                fn()
            }
          }
        })
      }
    }
  },

  compare(a,b,c){
    var arg_length=arguments.length
    if (arg_length==3){
      a = +a, b = +b, c = +c
      if (a <= b && a <= c) {
        return a
      }
      if (b <= a && b <= c) {
        return b
      }
      if (c <= a && c <= b) {
        return c
      }
    } else if (arg_length==2){
      a = +a, b = +b
      if(a<=b){
        return a
      }else{
        return b
      }
    }
    
  },
  
  globalData: {
    share_title:'路上良品   永远的良心品质',
    share_link:'/pages/index/index',
    // link_origin: 'https://x-shop.27aichi.com/',
    link_origin: 'https://mp-shop.27aichi.com/',
    image_origin:'https://27shop.oss-cn-beijing.aliyuncs.com/mp_pic/',

    userInfo_signature:'',//个人签名
    is_refresh:false,
    accredit:true,
  }
})