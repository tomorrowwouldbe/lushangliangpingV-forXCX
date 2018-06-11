var app=getApp()
Page({
  data:{
    f_openid:0, //邀请人openid,没有为0
    tel:'', //邀请人手机号
    beVip_status:true,  //成为会员按钮是否可点击
    goIndex_status:true  //回到首页按钮是否可点击
  },

  onLoad(options){
    //如果是分享页面进入
    if (options.f_openid)
      this.setData({
        f_openid: options.f_openid,
        tel:options.tel
      })
  },

  //点击 成为会员 按钮
  becomeVip(){
    this.setData({
      beVip_status:false
    })
    this.get_data()
  },

  //点击 回到首页 按钮
  goIndexPage(){
    this.setData({
      goIndex_status:false
    })
    wx.switchTab({
      url: '../index/index',
    })
  },

  get_data(again){
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      url: app.globalData.link_origin + 'pay_api/reg_member_pay',
      data: {
        token: app.DP({ 
          openid: openid, 
          session_id: session_id,
          f_openid: that.data.f_openid
        }),
        openid: openid,
        session_id: session_id,
        f_openid: that.data.f_openid
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          var infor=res.data.data
          wx.requestPayment({
            'timeStamp': infor.timeStamp,
            'nonceStr': infor.nonceStr,
            'package': infor.package,
            'signType': infor.signType,
            'paySign': infor.paySign,
            'success': function (res) {
              wx.showToast({
                title: '开通成功！',
                icon: 'success',
                duration: 2000
              })
              var pages = getCurrentPages(), route = pages[pages.length - 2].route
              var aa = wx.getStorageSync('lushang_userInfo')
              aa.is_member = 1
              wx.setStorageSync('lushang_userInfo', aa)
              app.resetSession(function(){
                var pages = getCurrentPages(), route = pages[pages.length - 2].route
                console.log(route == 'pages/productDetail/productDetail')
                if (route =='pages/submitOrder/submitOrder'){
                  pages[pages.length - 2].refresh()
                } else if (route =='pages/productDetail/productDetail'){
                  pages[pages.length - 2].setData({
                    is_member:1
                  })
                }
                setTimeout(function () {
                  wx.navigateBack({
                    delta: 1
                  })
                }, 500)
              })
            },
            'fail': function (res) {
              that.setData({
                beVip_status:true
              })
              wx.showToast({
                title: '支付失败！',
                icon: 'success',
                duration: 2000
              })
            }
          })
        } else if (!again && res.data.status == 4004) {
          that.setData({
            beVip_status: true
          })
          app.resetSession(that.get_data, true)
        } else {
          that.setData({
            beVip_status: true
          })
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        that.setData({
          beVip_status: true
        })
        app.showModal('请求超时！')
      }
    })
  },

  //页面分享
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      console.log(res.target)
    }
    return {
      title: app.globalData.share_title,
      path: app.globalData.share_link,
      success: function (res) { },
      fail: function (res) { }
    }
  }
})