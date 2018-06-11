var app=getApp()
Page({
  data:{
    recharge:{},
    image_origin: app.globalData.image_origin
  },
  onLoad(){
    this.get_data()
  },

  //获取数据
  get_data(again){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/get_user_recharge',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id
        }),
        openid: openid,
        session_id: session_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          res.data.data.s_lst.forEach(function (value, index) {
            value.createtime = app.transferTime(+value.createtime)
          })
          that.setData({
            recharge: res.data.data
          })
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_data,true)
        } else {
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        app.showModal('请求超时！')
      }
    })
  }
})