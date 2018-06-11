var app=getApp(),timer,timer1
Page({
  data:{
    phone:'',
    code:'',
    get_code_status:true,
    remain_time:60,
    coupons:[],
    register_status:true
  },

  onLoad(){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    this.get_coupons()
  },


  get_coupons(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/get_coupon',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          type: 2
        }),
        openid: openid,
        session_id: session_id,
        type:2
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          res.data.data.forEach(function(value){
            value.use_start_time = app.transferTime(value.use_start_time).split(' ')[0]
            value.use_end_time = app.transferTime(value.use_end_time).split(' ')[0]
          })
          that.setData({
            coupons:res.data.data
          })
          setTimeout(function(){
            that.loading.hideLoading()
          },1000)
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_coupons, true)
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

  phoneInput(e){
    var phone=e.detail.value
    this.setData({
      phone: app.trim(phone)
    })
  },
  codeInput(e){
    var code=e.detail.value
    this.setData({
      code:app.trim(code)
    })
  },

  //获取验证码
  getCode(again){
    var phone=this.data.phone
    if (phone.length != 11 || !/^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/.test(phone)){
      app.showModal('输入的手机号有误！')
      return;
    }
    
    var that=this
    var openid=wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/send_code',
      data: {
        token: app.DP({
          openid: openid,
          mobile:that.data.phone,
          session_id: session_id,
          type: 1
        }),
        openid: openid,
        mobile: that.data.phone,
        session_id: session_id,
        type: 1
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if(res.data.status==1000){
          that.setData({
            get_code_status: false
          })
          wx.showToast({
            title: '已发送！',
            icon: 'success',
            duration: 2000
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
        }else if(!again&&res.data.status==4004){
          that.setData({
            get_code_status: true
          })
          app.resetSession(that.getCode, true)
        }else{
          that.setData({
            get_code_status: true
          })
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(){
        that.setData({
          get_code_status: true
        })
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  //领取红包
  registerTap(again){
    if(!this.data.code.length){
      app.showModal('请先输入验证码！')
      return;
    }
    this.setData({
      register_status:false
    })
    var that=this
    var userInfo = wx.getStorageSync('userInfo'),
      openid=wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/register',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          source: 'shop',
          mobile: that.data.phone,
          smsCode: that.data.code,
          nickname: userInfo.nickName,
          sex: userInfo.gender,
          city: userInfo.city,
          country: userInfo.country,
          province: userInfo.province,
          headimgurl: userInfo.avatarUrl
        }),
        openid: openid,
        session_id: session_id,
        source:'shop',
        mobile:that.data.phone,
        smsCode: that.data.code,
        nickname: userInfo.nickName,
        sex: userInfo.gender,
        city: userInfo.city,
        country: userInfo.country,
        province: userInfo.province,
        headimgurl: userInfo.avatarUrl
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if(res.data.status==1000){
          wx.showToast({
            title: '登录成功！',
            icon: 'success',
            duration: 500
          })
          app.globalData.is_refresh=true
          app.resetSession(function(){
            setTimeout(function () {
              var pages=getCurrentPages()
              if(pages[pages.length-2].route=='pages/productDetail/productDetail'){
                pages[pages.length - 2].get_cart_num()
              }
              wx.navigateBack({
                delta: 1
              })
            }, 500)
          })
        }else if(!again&&res.data.status==4004){
          that.setData({
            register_status:true
          })
          app.resetSession(that.registerTap, true)
        }else{
          that.setData({
            register_status: true
          })
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(){
        that.setData({
          register_status: true
        })
        that.loading.hideLoading()
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
  }
})