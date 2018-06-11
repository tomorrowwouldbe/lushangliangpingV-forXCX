var app=getApp()
Page({
  data:{
    order_id:'',
    indicatorDots: false,
    autoplay: true,
    circular: true,
    interval: 2000,
    duration: 1000,

    express:undefined
  },

  onLoad(options){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    this.setData({
      order_id: options.order_id
    })
    this.get_data()
  },

  get_data(again){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/get_express_info',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: that.data.order_id
        }),
        openid: openid,
        session_id: session_id,
        order_id: that.data.order_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          var total_num = 0, imgUrls = [], express=[]
          res.data.data.goods.forEach(function(value){
            total_num += Number(value.goods_num)
            imgUrls.push(value.original_img)
          })
          if (res.data.data.express.message=='ok'){
            express = res.data.data.express.data
          }else{
            express=[]
          }
          that.setData({
            obj:res.data.data,
            total_num: total_num,
            imgUrls: imgUrls,
            express: express
          })
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_data, true)
        } else {
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  makeCall(e){
    var phone = this.data.obj.shipping_phone
    if (phone>0){
      wx.makePhoneCall({
        phoneNumber: phone
      })
    }
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