var app=getApp(),timer,timer1
Page({
  data:{
    mobile:'',  //手机号
    code:'',  //验证码
    new_pw:'',  //密码1
    new_pw_1:'',  //密码2
    remain_time:60, //剩余时间
    get_code_status:true  //是否可以获取验证码
  },

  onLoad(options){
    this.setData({
      mobile:options.mobile
    })
  },

  //获取验证码
  getCode(again){
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/send_code',
      data: {
        token: app.DP({
          openid: openid,
          mobile: that.data.mobile,
          session_id: session_id,
          type: 4
        }),
        openid: openid,
        mobile: that.data.mobile,
        session_id: session_id,
        type: 4
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {

          that.setData({
            get_code_status: false
          })
          timer = setTimeout(function () {
            that.setData({
              get_code_status: true
            })
          }, 60000)
          timer1 = setInterval(function () {
            that.setData({
              remain_time: that.data.remain_time >= 1 ? --that.data.remain_time : 60
            })
            if (that.data.remain_time == 60) {
              clearInterval(timer1)
              timer1 = null
            }
          }, 1000)

        } else if(!again&&res.data.status==4004){
          app.resetSession(that.getCode, true)
        }else {
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        app.showModal('请求超时！')
      }
    })
  },

  //输入 验证码
  codeInput(e){
    this.setData({
      code: app.trim(e.detail.value)
    })
  },

  //输入 密码
  setPW(e){
    this.setData({
      new_pw:app.trim(e.detail.value)
    })
  },
  
  //确认 密码
  resetPW(e) {
    this.setData({
      new_pw_1: app.trim(e.detail.value)
    })
  },

  //点击 完成 按钮
  completeTap(again){
    if(!this.data.code.length){
      app.showModal('请先输入验证码！')
      return;
    }
    if (this.data.new_pw.length&&this.data.new_pw!=this.data.new_pw_1){
      app.showModal('两次输入的密码不一致！')
      return;
    }
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/set_pay_pass',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          mobile: that.data.mobile,
          smsCode: that.data.code,
          npwd: that.data.new_pw
        }),
        openid: openid,
        session_id: session_id,
        mobile: that.data.mobile,
        smsCode:that.data.code,
        npwd:that.data.new_pw
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if(res.data.status==1000){
          wx.showModal({
            title: '温馨提示',
            content: '修改支付密码成功！',
            showCancel:false,
            confirmColor: '#cf2122',
            success: function (res) {
              if (res.confirm) {
                wx.navigateBack({
                  delta:1
                })
              }
            }
          })
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.completeTap, true)
        }else{
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        app.showModal('请求超时！')
      }
    })
  },

  onHide(){
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (timer1) {
      clearInterval(timer1)
      timer1 = null
    }
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

  onUnload(){
    this.onHide()
  }
})