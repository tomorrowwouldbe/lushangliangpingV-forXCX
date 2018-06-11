var app = getApp(), timer
Page({
  data: {
    is_staff: 0,
    order_id: '',
    order: {},
    product_amount: 0,
    pay_click: true,
    refund_status: true,
    cancel_status: true,
    show:true,
    status_str:'',
    status_code:null,
    refund_source:'normal',
    remain_time: {
      h: '00',
      m: '00',
      s: '00'
    },
    jump_click:true
  },

  onLoad: function (options) {
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    var is_staff = wx.getStorageSync('lushang_userInfo').is_staff
    this.setData({
      is_staff: is_staff,
      order_id: options.order_id
    })

    this.get_detail()
  },
  onShow() {
    this.setData({
      pay_click: true,
      refund_status: true,
      cancel_status: true,
      jump_click:true
    })
  },
  drawbackTap(e) {
    this.setData({
      refund_status: false
    })
    wx.navigateTo({
      url: '../drawback/drawback?order_id=' + e.currentTarget.dataset.id
    })
  },

  is_cancelTap(){
    var that=this
    wx.showModal({
      title: '温馨提示',
      content: '确认取消订单？',
      cancelColor: '#999999',
      confirmColor:'#cf2122',
      success: function (res) {
        if (res.confirm) {
          that.cancelOrderTap()
        } else if (res.cancel) {}
      }
    })
  },

  cancelOrderTap(again) {
    if (this.data.refund_source=='normal'){
      this.loading.showLoading()
    }
    this.setData({
      cancel_status: false
    })
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/cancel_order',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: that.data.order_id,
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
          if (that.data.refund_source == 'normal') {
            wx.showToast({
              title: '取消成功！',
              icon: 'success',
              duration: 2000
            })
          }
          that.get_detail()
          that.loading.showLoading()
        } else if (!again && res.data.status == 4004) {
          that.setData({
            cancel_status: true
          })
          app.resetSession(that.get_detail, true)
        } else {
          that.setData({
            cancel_status: true
          })
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.setData({
          cancel_status: true
        })
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  get_detail(again) {
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/get_view',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: that.data.order_id,
          view_type: 1
        }),
        openid: openid,
        session_id: session_id,
        order_id: that.data.order_id,
        view_type: 1
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          var num = 0
          res.data.data.goods.forEach(function (value) {
            num += +value.goods_num
          })
          var last_time = Number(res.data.data.add_time) + Number(3600),
            now = res.data.data.server_time, order = res.data.data, h, m, s, add_five = false
          if (order.status_code == 1) {
            timer = setInterval(function () {
              now++
              var time = last_time - now
              if (time >= 0) {
                h = parseInt(time / 3600)
                m = parseInt(time % 3600 / 60)
                s = parseInt(time % 3600 % 60)
              }else{
                h=0,m=0,s=0
              }
              that.setData({
                remain_time: {
                  h: h < 0 ? '00' : h < 10 ? ('0' + h) : h,
                  m: m < 0 ? '00' : m < 10 ? ('0' + m) : m,
                  s: s < 0 ? '00' : s < 10 ? ('0' + s) : s
                }
              })
              if (h<=0 && m <= 0 && s <= 0) {
                clearInterval(timer)
                timer = null
                // that.setData({
                //   show: false
                // })
                that.setData({
                  refund_source:'auto'
                })
                that.cancelOrderTap()
              }
            }, 1000)
          }
          // res.data.data.add_time = app.transferTime(res.data.data.add_time)
          if(that.data.refund_source=='auto'){
            that.setData({
              status_str: res.data.data.status_str,
              status_code: res.data.data.status_code
            })
          } else if (that.data.refund_source == 'normal'){
            that.setData({
              status_str: res.data.data.status_str,
              status_code: res.data.data.status_code,
              order: res.data.data,
              product_amount: num
            })
          }
          
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_detail, true)
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


  pay(again) {
    this.loading.showLoading()
    this.setData({
      pay_click: false
    })
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
          that.setData({
            pay_click: true
          })
          app.resetSession(that.pay, true)
        } else {
          that.setData({
            pay_click: true
          })
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.setData({
          pay_click: true
        })
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
        that.get_detail()
      },
      'fail': function (res) {
        that.setData({
          pay_click: true
        })
        wx.showToast({
          title: '支付失败！',
          icon: 'success',
          duration: 2000
        })
      }
    })
  },

  closeNoTap(){
    this.setData({
      no_sale:false
    })
  },

  jump(e){
    var id=e.currentTarget.dataset.id,
      order = this.data.order
    for (var i = 0; i < order.goods.length;i++){
      if (order.goods[i].goods_id = id && order.goods[i].is_on_sale != 1) {
        this.setData({
          no_sale: true
        })
        return
      }
    }
    
    if(this.data.jump_click){
      this.setData({
        jump_click:false
      })
      wx.navigateTo({
        url: '../productDetail/productDetail?goods_id='+id,
      })
    }
  },

  confirmGet(again){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'order_api/finish_order',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          order_id: that.data.order.order_id
        }),
        openid: openid,
        session_id: session_id,
        order_id: that.data.order.order_id
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
          that.get_detail()
          that.loading.hideLoading()
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

  lookTransfer(){
    wx.navigateTo({
      url: '../logistics/logistics?order_id=' + this.data.order_id,
    })
  },

  onUnload() {
    var pages = getCurrentPages(), route = pages[pages.length - 2].route
    if (route == 'pages/productDetail/productDetail') {
      pages[pages.length - 2].setData({
        choices_hidden: true
      })
    }
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
})