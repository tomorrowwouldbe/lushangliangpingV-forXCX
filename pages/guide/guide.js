var app=getApp()

Page({
  data:{
    
  },
  onLoad(){
    let that=this
    wx.getUserInfo({
      success: function (res) {
        setTimeout(()=>{
          wx.reLaunch({
            url: '../index/index',
          })
        },1000)
      }
    })
  },
  onGotUserInfo(e){
    console.log(e.detail)
    wx.reLaunch({
      url: '../index/index',
    })
  }
})