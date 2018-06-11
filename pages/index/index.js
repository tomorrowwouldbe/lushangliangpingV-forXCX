var app = getApp()
var winHeight, platform, timer
wx.getSystemInfo({
  success: function (res) {
    platform = res.model.split(' ')[0]
    winHeight = res.windowHeight
  }
})
Page({
  data: {
    image_origin: app.globalData.image_origin,
    indicatorDots: true,  //swiper圆点显示
    autoplay: true, //swiper自动轮播
    interval: 5000,
    duration: 500,
    circular: true,
    //index-nav
    navActiveIndex: 0,
    scroll_fixed: false,  //滚动时tab栏是否固定
    platform: platform,  //手机型号
    winHeight: winHeight,

    banner: [], //banner图
    tabList: [],//tab切换内容
    is_staff: 0,
    tab_show: false,  //是否显示tab
    tabIndex: 0,
    jump_1_click: true,  //是否可以点击 去内容详情页
    jump_2_click: true,  //是否可以点击 去商家详情页
    touch_start: [],
    touch_end: [],
    banner_load: false,
    content_load: false
  },

  //banner图加载
  bannerLoad(e) {
    var banner = this.data.banner, index = e.currentTarget.dataset.index
    banner[index].banner_show = true
    this.setData({
      banner: banner
    })
  },

  //内容图加载
  productLoad(e) {
    var tabList = this.data.tabList, id = e.currentTarget.dataset.id
    tabList.forEach(function (value) {
      value.list.forEach(function (val) {
        if (val.id == id) {
          val.product_show = true
        }
      })
    })
    this.setData({
      tabList: tabList
    })
  },

  //tab内容手机控制切换：开始
  touchstart(e) {
    var a = e.changedTouches[0]
    this.setData({
      touch_start: [a.pageX, a.pageY]
    })

  },
  //tab内容手机控制切换：结束
  touchend(e) {
    var b = e.changedTouches[0]
    this.setData({
      touch_end: [b.pageX, b.pageY]
    })
    var a = this.data.touch_start, c = this.data.touch_end
    var delta_x = c[0] - a[0], delta_y = c[1] - a[1]
    if (Math.abs(delta_x) >= Math.abs(delta_y) && Math.abs(delta_x) >= 100) {
      if (delta_x < 0) {
        this.indexNavTap(1)
      } else if (delta_x > 0) {
        this.indexNavTap(0)
      }
    }
  },

  //页面加载
  onLoad: function () {
    this.loading = this.selectComponent('#loadingC')
    this.cover = this.selectComponent('#cover')
    this.loading.showLoading()
    app.resetSession(this.allRequest)
  },

  //请求并发
  allRequest() {
    this.setData({
      is_staff: app.globalData.accredit
    })
    this.get_banner()
    this.get_content()
  },

  //检测是否已经加载完成
  checkResult(that) {
    if (this.data.banner_load && this.data.content_load) {
      wx.stopPullDownRefresh()
      that.loading.hideLoading()
    }
  },

  //重置 重复点击 状态 与 重新授权 后 检测是否显示 员工内购入口 
  onShow() {
    if (wx.getStorageSync('lushang_userInfo')) {
      var is_staff = wx.getStorageSync('lushang_userInfo').is_staff
      this.setData({
        is_staff: is_staff
      })
      this.cover.closeCover()
    }
    this.setData({
      jump_1_click: true,
      jump_2_click: true
    })
  },

  onHide(){
    this.loading.hideLoading()
  },

  //点击 未授权 提醒
  setting() {
    var that = this
    wx.openSetting({
      success: (res) => {
        console.log(res)
        if (res.authSetting["scope.userInfo"]) {
          app.globalData.is_refresh = true
          app.globalData.accredit = true
          app.resetSession(this.onShow)
        }
        that.cover.closeCover()
      }
    })
  },


  //获取 banner图
  get_banner(again) {
    var that = this
    if (wx.getStorageSync('lushang_userInfo')) {
      var openid = wx.getStorageSync('lushang_userInfo').openid,
        is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
        sign = app.globalData.userInfo_signature,
        session_id = wx.getStorageSync('session_id')
      this.setData({
        is_staff: is_staff
      })
    }
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'index_api/get_index_banner',
      data: {
        token: app.DP({
          openid: openid,
          sign: sign,
          session_id: session_id
        }),
        openid: openid,
        sign: sign,
        session_id: session_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          var banner = res.data.data
          banner.forEach(function (value) {
            value.banner_show = false
            var arr = value.ad_link.split('/')
            value.goods_id == ''
            for (var i = 0; i < arr.length; i++) {
              if (arr[i] > 0 && arr[i - 1] == 'id') {
                value.goods_id = arr[i]
                break
              }
            }
          })
          that.setData({
            banner: banner,
            banner_load: true
          })
          that.checkResult(that)
          if (!app.globalData.accredit) {
            that.cover.openCover()
          } else {
            that.cover.closeCover()
          }
          // that.get_content()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_banner, true)
        } else {
          that.loading.hideLoading()
          app.showModal(res.data.msg)        
        }
      },
      fail(res) {
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  //获取 tab内容
  get_content(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      sign = app.globalData.userInfo_signature,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'index_api/get_index_connect',
      data: {
        token: app.DP({
          openid: openid,
          sign: sign,
          session_id: session_id
        }),
        openid: openid,
        sign: sign,
        session_id: session_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          res.data.data.forEach(function (value) {
            value.list.forEach(function (val) {
              val.product_show = false
              if (val.content.match(/&nbsp;/g)) {
                val.content = val.content.split('&nbsp;').join('')
              }
            })
          })
          that.setData({
            tabList: res.data.data,
            tab_show: true,
            content_load: true
          })
          that.checkResult(that)
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_content, true)
        } else {
          wx.stopPullDownRefresh()
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        wx.stopPullDownRefresh()
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  //跳转内容详情
  goContentPage: function (e) {
    var id = e.currentTarget.dataset.id
    if (this.data.jump_1_click) {
      this.setData({
        jump_1_click: false
      })
      wx.navigateTo({
        url: '../contentDetails/contentDetails?id=' + id,
      })
    }
  },

  //跳转商家详情
  goMerchantPage: function (e) {
    var business_id = e.currentTarget.dataset.id
    if (this.data.jump_2_click) {
      this.setData({
        jump_2_click: false
      })
      wx.navigateTo({
        url: '../merchant/merchant?business_id=' + business_id,
      })
    }
  },

  //tab切换
  indexNavTap: function (e) {
    var index = e >= 0 ? e : e.currentTarget.dataset.index
    this.setData({
      navActiveIndex: index,
      tabIndex: index
    })
  },

  //跳转员工内购
  goStaffBuy: function () {
    wx.navigateTo({
      url: '../staffBuy/staffBuy'
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

  //页面滚动
  onPageScroll: function (e) {
    this.setData({
      scroll_fixed: e.scrollTop >= 185,
      scrollTop: e.scrollTop
    })
  },

  onUnload() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    this.loading.hideLoading()
  },

  //删除个人注册手机号
  deleteTap(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      sign = app.globalData.userInfo_signature,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + '/index/del_user',
      data: {
        token: app.DP({
          openid: openid,
          sign: sign,
          session_id: session_id,
          phone: 13269852001
        }),
        openid: openid,
        sign: sign,
        session_id: session_id,
        phone: 13269852001
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          app.showModal('删除成功！')
          //13269852001
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.deleteTap, true)
        } else {
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  }
})