var app=getApp()
var WxParse = require('../../wxParse/wxParse.js');
Page({
  data:{
    id:null,  //商家id
    contentObj:{},  //商家对象
    can_click:true  //是否可以点击
  },

  onLoad(options){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    var id=options.id
    this.setData({
      id:id
    })
    this.get_data()
  },

  onShow(){
    this.setData({
      can_click:true
    })
  },

  get_data(again){
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      sign = app.globalData.userInfo_signature,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'index_api/news_contend',
      data: {
        token: app.DP({
          openid: openid,
          sign: sign,
          session_id: session_id,
          id: that.data.id
        }),
        openid: openid,
        sign: sign,
        session_id: session_id,
        id:that.data.id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {

          //富文本转义
          var article1 = res.data.data.content
          WxParse.wxParse('article1', 'html', article1, that, 5);

          that.setData({
            contentObj:res.data.data,
            content: res.data.data.content
          })
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_data, true)
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

  //关闭 购物车已下架 弹窗
  closeNoTap(){
    this.setData({
      no_sale:false
    })
  },

  //点击 立即购买 按钮
  goProductDetail:function(){
    if (this.data.contentObj.is_on_sale!=1){
      this.setData({
        no_sale:true
      })
      return
    }
    this.setData({
      can_click: false
    })
    wx.navigateTo({
      url: '../productDetail/productDetail?goods_id=' + this.data.contentObj.goods_id,
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