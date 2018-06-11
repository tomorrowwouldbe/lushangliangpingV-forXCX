var app=getApp()
Page({
  data:{
    selectedIndex:0,  //选择的充值方式
    isKnowed:false, //是否已了解
    balance:0,  //奖金余额
    money:'', //充值金额
    pwd_alert_show:false, //密码弹窗是否显示
    pwd_input:'', //输入的密码值
    error_att:false,  //是否显示错误提示
    pay_status:true //充值按钮是否可点击
  },

  onLoad:function(){
    var balance_reward = wx.getStorageSync('balance_reward')
    this.setData({
      balance: Number(balance_reward).toFixed(2)
    })
  },

  //点击 已了解
  knowTap:function(){
    this.setData({
      isKnowed: !this.data.isKnowed
    })
  },

  //选择充值方式
  selectTap:function(e){
    var index=e.currentTarget.dataset.index
    this.setData({
      selectedIndex: index,
      isKnowed:false
    })
  },

  //关闭 密码弹窗（奖金余额）
  closePwdAlert(){
    this.setData({
      pwd_alert_show:false
    })
  },

  //打开 密码弹窗
  openPwdAlert(){
    this.setData({
      pwd_alert_show: true
    })
  },

  //输入 密码
  pwdInput(e){
    this.setData({
      pwd_input:e.detail.value
    })
  },

  //密码弹窗 确认
  pwdConfirm(again){
    var a = this.data.pwd_input
    if (a.length<6){
      app.showModal('所填密码必须是6位数！')
      return;
    }
    if (this.data.pwd_input.length < 6) {
      app.showModal('所输密码不是6位数！')
      return
    }
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          sign: app.globalData.userInfo_signature,
          type: 1,
          total_fee: this.data.money,
          pwd: this.data.pwd_input
        }),
        openid: openid,
        session_id: session_id,
        sign: app.globalData.userInfo_signature,
        type: 1,
        total_fee: this.data.money,
        pwd: this.data.pwd_input
      }
    this.setData({
      pwd_alert_show: false
    })
    wx.request({
      url: app.globalData.link_origin + 'pay_api/pay_rechange',
      data: data,
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          wx.showToast({
            title: '充值成功！',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function () {
            wx.switchTab({
              url: '../mine/mine',
            })
          }, 2000)
        } else if (!again && res.data.status == 4004) {
          app.restSession(that.pwdConfirm, true)
        } else {
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        app.showModal('请求超时！')
      }
    })
  },

  //输入 充值金额
  moneyInput(e){
    var val=e.detail.value
    this.setData({
      money:val
    })
  },

  //点击 充值 按钮
  chargeTap(again){
    if(this.data.money==0){
      app.showModal('充值金额不能为0！')
      return;
    }
    if (this.data.money.length==0) {
      app.showModal('充值金额不能为空！')
      return;
    }
    if (this.data.selectedIndex == 1 && +this.data.money > +this.data.balance) {
      app.showModal('充值金额不能大于奖金余额！')
      return
    }
    this.setData({
      pay_status:false
    })
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      data
    if (this.data.selectedIndex==0){
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          sign: app.globalData.userInfo_signature,
          type: 2,
          total_fee: this.data.money
        }),
        openid: openid,
        session_id: session_id,
        sign: app.globalData.userInfo_signature,
        type:2,
        total_fee:this.data.money
      }
      wx.request({
        url: app.globalData.link_origin + 'pay_api/pay_rechange',
        data: data,
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        method: 'POST',
        success: function (res) {
          if (res.data.status == 1000) {
            var order = res.data.data
            wx.requestPayment({
              'timeStamp': order.timeStamp,
              'nonceStr': order.nonceStr,
              'package': order.package,
              'signType': order.signType,
              'paySign': order.paySign,
              'success': function (res) {
                wx.showToast({
                  title: '充值成功！',
                  icon: 'success',
                  duration: 2000
                })
                setTimeout(function () {
                  wx.switchTab({
                    url: '../mine/mine',
                  })
                }, 2000)
              },
              'fail': function (res) {
                that.setData({
                  pay_status:true
                })
                wx.showToast({
                  title: '充值失败！',
                  icon: 'success',
                  duration: 2000
                })
              }
            })
          } else if (!again && res.data.status == 4004) {
            that.setData({
              pay_status: true
            })
            app.restSession(that.chargeTap, true)
          } else {
            that.setData({
              pay_status: true
            })
            app.showModal(res.data.msg)
          }
        },
        fail(res) {
          that.setData({
            pay_status: true
          })
          app.showModal('请求超时！')
        }
      })
    } else if (this.data.selectedIndex==1){
      if (this.data.selectedIndex == 1) {
        this.setData({
          pwd_alert_show: true
        })
      }
    }
  }
})