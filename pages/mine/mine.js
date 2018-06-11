var app = getApp(), req_status_1, req_status_2, req_status_3, req_status_4
Page({
  data:{
    userInfo:'',
    lushang_user:wx.getStorageSync('mine'),
    invited_num:0,
    coupons_num:0,
    orders:{},
    is_member:0,
    status: ''
  },

  onLoad(){
    this.loading = this.selectComponent('#loadingC')
    this.cover = this.selectComponent('#cover')
    this.setData({
      userInfo: wx.getStorageSync('userInfo')
    })
  },

  setting() {
    var that = this
    wx.openSetting({
      success: (res) => {
        if (res.authSetting["scope.userInfo"]) {
          that.cover.closeCover()
          that.loading.showLoading()
          app.globalData.is_refresh = true
          app.globalData.accredit=true
          app.resetSession(that.onShow)
        }
      }
    })
  },

  onShow(){
    if (!app.globalData.accredit) {
      this.cover.openCover()
      return
    } else {
      this.cover.closeCover()
    }
    var that = this
    var is_user = wx.getStorageSync('lushang_userInfo').is_user,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    this.setData({
      is_member: is_member
    })
    if (is_user == 0) {
      that.setData({
        status: 'unregisted'
      })
      that.loading.hideLoading()
    } else if (is_user == 1) {
      that.setData({
        status: 'registed',
        userInfo: wx.getStorageSync('userInfo')
      })
      that.get_userInfo()
      that.get_order_num()
      that.get_invite_num()
      that.get_coupons_num()
    }
  },


  onHide(){
    this.setData({
      status: ''
    })
  },

  goRegisterTap() {
    wx.navigateTo({
      url: '../register/register',
    })
  },

  check(){
    if (req_status_1 && req_status_2 && req_status_3 && req_status_4){
      this.loading.hideLoading()
    }
  },

  //获取 订单信息
  get_order_num(again) {
    req_status_1=false
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/get_order_total',
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
            orders:res.data.data
          })
          req_status_1=true
          that.check()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_order_num, true)
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


  //获取 个人信息
  get_userInfo(again){
    req_status_1=false
    var that=this,
      openid=wx.getStorageSync('lushang_userInfo').openid,
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
        if (res.data.status==1000){
          that.setData({
            lushang_user: res.data.data
          })
          wx.setStorageSync('mine', res.data.data)
          wx.setStorageSync('balance_reward', res.data.data.member.balance_reward)
          wx.setStorageSync('lushang_user_tel', res.data.data.member.mobile)
          req_status_2=true
          that.check()
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_userInfo)
        }else{
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

  //获取 我的邀请人数
  get_invite_num(again){
    req_status_3=false
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
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
        if (res.data.status == 1000) {
          that.setData({
            invited_num: res.data.data.vips.length + res.data.data.fans.length
          })
          req_status_3=true
          that.check()
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_invite_num)
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

  //获取 优惠券数量
  get_coupons_num(again){
    req_status_4=false
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      url: app.globalData.link_origin + 'member_api/get_coupon_list',
      data: {
        token: app.DP({ openid: openid, session_id: session_id,is_use:0 }),
        openid: openid,
        session_id: session_id,
        is_use:0
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          that.setData({
            coupons_num:res.data.data.length
          })
          req_status_4=true
          that.check()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_coupons_num)
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

  //回到 首页
  goHome() {
    wx.switchTab({
      url: '../index/index',
    })
  }
})