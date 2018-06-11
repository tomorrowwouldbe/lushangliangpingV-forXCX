var app=getApp()
Page({
  data:{
    business_id:'',
    content:[],
    image_origin: app.globalData.image_origin
  },
  onLoad(options){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    this.setData({
      business_id: options.business_id
    })
    this.get_shop_info()
    this.get_shop_contend()
  },

  get_shop_info(again){
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      sign = app.globalData.userInfo_signature,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'index_api/get_shop_info',
      data: {
        token: app.DP({
          openid: openid,
          sign: sign,
          session_id: session_id,
          business_id: that.data.business_id
        }),
        openid: openid,
        sign: sign,
        session_id: session_id,
        business_id: that.data.business_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          that.setData({
            merchant:res.data.data
          })
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.data.get_shop_info, true)
        } else {
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  get_shop_contend(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      sign = app.globalData.userInfo_signature,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'index_api/get_shop_contend',
      data: {
        token: app.DP({
          openid: openid,
          sign: sign,
          session_id: session_id,
          business_id: that.data.business_id
        }),
        openid: openid,
        sign: sign,
        session_id: session_id,
        business_id: that.data.business_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          res.data.data.forEach(function(value){
            if(value.content.match(/&nbsp;/g)){
              value.content = value.content.split('&nbsp;').join('')
            }
          })
          that.setData({
            content:res.data.data
          })
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.data.get_shop_contend, true)
        } else {
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        that.loading.hideLoading()
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