var app=getApp()
Page({
  data:{
    can_edit:false
  },
  onLoad(options){
    this.setData({
      tel:options.tel,
      f_openid:options.f_openid
    })
  },

  onShow(){
    app.resetSession(this.check)
  },

  check(){
    var openid=wx.getStorageSync('lushang_userInfo').openid
    if (openid == this.data.f_openid){
      wx.navigateTo({
        url: '../inviteFriends/inviteFriends',
      })
    }else{
      this.setData({
        can_edit:true
      })
    }
  },

  goVipPage(){
    wx.navigateTo({
      url:'../becomeVip/becomeVip?tel='+this.data.tel+'&f_openid='+this.data.f_openid
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