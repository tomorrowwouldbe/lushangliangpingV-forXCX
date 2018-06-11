var app=getApp()
Page({
  data:{
    image_origin: app.globalData.image_origin
  },
  onLoad:function(){
    
  },
  onShareAppMessage: function (res) {
    var openid=wx.getStorageSync('lushang_userInfo').openid,
      tel=wx.getStorageSync('lushang_user_tel')
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '加入路上',
      path: '/pages/joinus/joinus?tel='+tel+'&f_openid=' + openid,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },

  onUnload(){
    var pages=getCurrentPages(),route=pages[pages.length-2].route
    if(route=='pages/joinus/joinus'){
      wx.switchTab({
        url: '../index/index',
      })
    }
  }
})