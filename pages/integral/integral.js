var app=getApp()
Page({
  data:{
    helpAlertShow:false,  //help弹窗是否显示
    points:{},
    image_origin: app.globalData.image_origin
  },
  onLoad:function(){
    this.get_data()
  },

  get_data(again){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/get_user_points',
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
            points: res.data.data
          })
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_data, true)
        } else {
          app.showModal(res.data.msg)
        }
      },
      fail(){
        app.showModal('请求超时！')
      }
    })
  },

  //打开弹窗
  showHelpTap:function(){
    this.setData({
      helpAlertShow:true
    })
  },

  //关闭弹窗
  closeHelpTap:function(){
    this.setData({
      helpAlertShow: false
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