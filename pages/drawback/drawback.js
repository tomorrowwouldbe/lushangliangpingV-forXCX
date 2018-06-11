var app=getApp()
Page({
  data:{
    is_staff:0,
    reason:'',  //退款理由
    reason_type:'', //退款类型
    reason_comment:'',  //退款说明
    order_id:'',  //订单id
    order:{}, //订单对象
    product_amount:0  //商品数量
  },

  onLoad(options){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    var is_staff=wx.getStorageSync('lushang_userInfo').is_staff
    this.setData({
      is_staff: is_staff,
      order_id:options.order_id
    })
    this.get_detail()
  },

  //输入退款说明
  commentInput(e){
    this.setData({
      reason_comment:e.detail.value
    })
  },

  //选择 退款原因
  chooseReasons(){
    var that = this, arr = [],
      reasonsArr = this.data.order.reason_type
    for (var i in reasonsArr){
      arr.push(reasonsArr[i])
    }
    wx.showActionSheet({
      itemList:arr,
      success: function (res) {
        var key=''
        for (var i in reasonsArr) {
          if (reasonsArr[i] == arr[res.tapIndex]){
            key=i
            break
          }
        }
        that.setData({
          reason:arr[res.tapIndex],
          reason_type:key
        })
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })
  },

  get_detail(again) {
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/refund_order',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: that.data.order_id,
          view_type: 1
        }),
        openid: openid,
        session_id: session_id,
        order_id: that.data.order_id,
        view_type: 1
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          var num = 0
          res.data.data.goods.forEach(function (value) {
            num += +value.goods_num
          })
          that.setData({
            order: res.data.data,
            product_amount: num
          })
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_detail, true)
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

  //提交 退款申请
  submitTap(again){
    if (!this.data.reason_type.length){
      app.showModal('请先选择退款原因！')    
      return;
    }

    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/refund_apply',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: that.data.order_id,
          reason_type: that.data.reason_type,
          reason_comment: that.data.reason_comment
        }),
        openid: openid,
        session_id: session_id,
        order_id: that.data.order_id,
        reason_type: that.data.reason_type,
        reason_comment: that.data.reason_comment
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          wx.showToast({
            title: '提交成功！',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function(){
            wx.navigateBack({
              delta:1
            })
          },2000)
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.submitTap, true)
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
  },

  onUnload(){
    var pages=getCurrentPages()
    pages[pages.length - 2].setData({
      order_id: this.data.order_id
    })

    pages[pages.length - 2].get_detail()
  }
})