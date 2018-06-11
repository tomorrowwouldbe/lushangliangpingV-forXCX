var app = getApp(), winHeight
wx.getSystemInfo({
  success: function (res) {
    winHeight = res.windowHeight
  }
})
Page({
  data:{
    link_origin: app.globalData.link_origin + 'mp_pic/',
    navActiveIndex:0,
    is_staff:0,
    list_all:[],
    null_show:false,
    page_index:1,
    rows:10,
    no_more:false,
    order_status:'',
    jump_click:true,
    winHeight: winHeight
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
        if(index<4){
          index++
          this.navChooseTap(index)
        }
      } else if (delta_x > 0) {
        if(index>0){
          index--
          this.navChooseTap(index)
        }
      }
    }
  },

  
  onLoad:function(options){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    var is_staff=wx.getStorageSync('lushang_userInfo').is_staff
    var type = options.type, arr = ['', 'WAITPAY', 'WAITSEND', 'WAITRECEIVE', 'FINISH']
    this.setData({
      navActiveIndex:type,
      is_staff: is_staff,
      page_index: 1,
      list_all: [],
      no_more: false,
      order_status: arr[type]
    })
  },

  onShow(){
    this.loading.showLoading()
    this.setData({
      page_index: 1,
      list_all: [],
      no_more: false,
      jump_click:true
    })
    this.get_data()
  },

  onPullDownRefresh(){
    this.setData({
      page_index: 1,
      list_all: [],
      no_more: false
    })
    this.get_data()
  },

  //获取 数据
  get_data(again){
    if(this.data.page_index==-1){
      return;
    }
    var that=this,
      openid=wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/get_list',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          page:that.data.page_index,
          rows:that.data.rows,
          order_status: that.data.order_status
        }),
        openid: openid,
        session_id: session_id,
        page: that.data.page_index,
        rows: that.data.rows,
        order_status: that.data.order_status
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if(res.data.status==1000){
          var list_all = that.data.list_all
          res.data.data.list.forEach(function(value){
            var num=0
            value.goods.forEach(function(val){
              num += +val.goods_num
            })
            value.total_num=num
            list_all.push(value)
          })
          if (res.data.data.list.length<that.data.rows){
            that.setData({
              no_more:true,
              page_index:-1
            })
          }

          that.setData({
            list_all: list_all,
            null_show:list_all.length==0
          })
          wx.stopPullDownRefresh()
          that.loading.hideLoading()
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_data, true)
        }else{
          wx.stopPullDownRefresh()
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(){
        wx.stopPullDownRefresh()
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },
  navChooseTap:function(e){
    this.loading.showLoading()
    var index=e>=0?e:e.currentTarget.dataset.index,
      arr = ['', 'WAITPAY', 'WAITSEND', 'WAITRECEIVE','FINISH']
    this.setData({
      navActiveIndex:index,
      page_index:1,
      list_all:[],
      no_more:false,
      order_status:arr[index]
    })
    this.get_data()
  },

  pay(e){
    this.loading.showLoading()
    this.setData({
      order_id: e.currentTarget.dataset.id
    })
    this.get_order()
  },

  get_order(again) {
    this.loading.showLoading()
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'pay_api/pay',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: that.data.order_id
        }),
        openid: openid,
        session_id: session_id,
        order_id: that.data.order_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          res.data.data.last_pay_time = app.transferTime(res.data.data.last_pay_time)
          that.setData({
            order_infor: res.data.data
          })
          that.loading.hideLoading()
          that.confirmPay()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_order, true)
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

  confirmPay: function () {
    var that = this, order = this.data.order_infor
    wx.requestPayment({
      'timeStamp': order.timeStamp,
      'nonceStr': order.nonceStr,
      'package': order.package,
      'signType': order.signType,
      'paySign': order.paySign,
      'success': function (res) {
        wx.showToast({
          title: '支付成功！',
          icon: 'success',
          duration: 2000
        })
      },
      'fail': function (res) {
        wx.showToast({
          title: '支付失败！',
          icon: 'success',
          duration: 2000
        })
      }
    })
  },

  onReachBottom(){
    this.setData({
      page_index: this.data.page_index == -1 ? this.data.page_index:(++this.data.page_index)
    })
    
    this.get_data(true)
  },

  confirmGet(e,again){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      order_id=e.currentTarget.dataset.id
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/finish_order',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: order_id
        }),
        openid: openid,
        session_id: session_id,
        order_id:order_id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          wx.showToast({
            title: '确认成功！',
            icon: 'success',
            duration: 2000
          })
          that.navChooseTap(4)
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.confirmGet, true)
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

  jump(e){
    var id=e.currentTarget.dataset.id
    if (this.data.jump_click){
      this.setData({
        jump_click:false
      })
      wx.navigateTo({
        url: '../orderDetail/orderDetail?order_id=' + id
      })
    }
  }
})