var app = getApp(), winHeight
wx.getSystemInfo({
  success: function (res) {
    winHeight = res.windowHeight
  }
})
Page({
  data:{
    listOneShow:false,
    activeIndex:0,
    winHeight: winHeight,
    fans:[],
    vips:[]
  },

  touchstart(e) {
    var a = e.changedTouches[0]
    this.setData({
      touch_start: [a.pageX, a.pageY]
    })
  },
  touchend(e) {
    var b = e.changedTouches[0]
    this.setData({
      touch_end: [b.pageX, b.pageY]
    })
    var a = this.data.touch_start, c = this.data.touch_end
    var delta_x = c[0] - a[0], delta_y = c[1] - a[1]
    if (Math.abs(delta_x) >= Math.abs(delta_y) && Math.abs(delta_x) >= 100) {
      if (delta_x < 0) {//向左滑动
        this.chooseListTap(1)
      } else if (delta_x > 0) {
        this.chooseListTap(0)
      }
    }
  },

  onLoad:function(){
    this.get_data()
  },

  //获取数据
  get_data(){
    var that=this,
      openid=wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/get_fans',
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
        if(res.data.status==1000){
          that.setData({
            fans:res.data.data.fans,
            vips:res.data.data.vips
          })
        }else{
          app.showModal(res.data.msg)
        }
      }
    })
  },

  chooseListTap:function(e){
    var index=e>=0?e:e.currentTarget.dataset.index
    this.setData({
      listOneShow: index==0?false:true,
      activeIndex:index
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