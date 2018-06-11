var app = getApp(), winHeight
wx.getSystemInfo({
  success: function (res) {
    winHeight = res.windowHeight
  }
})
Page({
  data:{
    winHeight: winHeight,
    navActiveIndex:0,
    has_coupons:1,//默认有优惠券
    list_show:[],//显示的优惠券
    list:[],//全部优惠券
    list_used:[],//已使用优惠券
    list_remain:[]//未使用优惠券
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
    var index = this.data.navActiveIndex
    if (Math.abs(delta_x) >= Math.abs(delta_y) && Math.abs(delta_x) >= 100) {
      if (delta_x < 0) {//向左滑动
        if(index<2){
          index++
          this.navChooseTap(index)
        }
      } else if (delta_x > 0) {
        if (index>0) {
          index--
          this.navChooseTap(index)
        }
      }
    }
  },

  onLoad:function(){
    this.get_data()
  },

  //tab切换
  navChooseTap:function(e){
    var index=e>=0?e:e.currentTarget.dataset.index
    this.setData({
      navActiveIndex:index,
      list_show: index == 0 ? this.data.list : index == 1 ? this.data.list_remain:this.data.list_used,
      has_coupons: index == 0 ? this.data.list.length : index == 1 ? this.data.list_remain.length : this.data.list_used.length
    })
  },

  get_data(again){
    var that= this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      url: app.globalData.link_origin + 'member_api/get_coupon_list',
      data: {
        token: app.DP({ openid: openid, session_id: session_id }),
        openid: openid,
        session_id: session_id
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          var list_used=[],list_remain=[]
          res.data.data.forEach(function(value){
            value.use_start_time = app.transferTime(value.use_start_time).slice(0,10)
            value.use_end_time = app.transferTime(value.use_end_time).slice(0, 10)
            if(value.is_use==0){
              list_remain.push(value)
            } else if (value.is_use==1){
              list_used.push(value)
            }
          })
          that.setData({
            list_show:res.data.data,
            has_coupons: res.data.data.length>0,
            list:res.data.data,
            list_remain: list_remain,
            list_used: list_used
          })
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_data, true)
        } else {
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
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
  }
})