var app=getApp()
Page({
  data:{
    lushang_user:''
  },
  onLoad(){
    this.get_userInfo()
  },

  //获取 个人信息
  get_userInfo(again) {
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/get_user_info',
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
          that.setData({
            lushang_user: res.data.data
          })
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_userInfo, true)
        } else {
          app.showModal(res.data.msg)
        }
      },
      fail(){
        app.showModal('请求超时！')
      }
    })
  }
})