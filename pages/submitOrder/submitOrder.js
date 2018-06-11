var app=getApp()
Page({
  data:{
    couponsShow:false,  //优惠券弹窗是否显示
    interShow:false,  //积分兑换弹窗是否显示
    couponNavActive:0,  //优惠券tab栏
    submit:false, //立即支付是否可以点击  true表示已点击 false表示未点击
    source:'',  //订单的来源，cart/goods
    cart:'',  //来源：购物车页面，cart表示goods_id拼接的字符串
    defaultAddress:{},  //显示的地址对象
    order:{}, //订单对象
    coupon_canuse:[], //可用优惠券列表
    coupon_nouse:[],  //不可用优惠券列表

    recharge:0, //提交的 余额
    points:0, //提交的 积分
    coupon_id: 0, //优惠券id 没选优惠券为0
    coupon_list_id: 0,  //优惠券表单id 没选优惠券为0
    wating_pay:0, //X

    points_use:0, //使用的积分
    points_use_back:0,  //使用的积分 备用
    recharge_use:0, //使用的余额
    recharge_use_back:0,  //使用的余额 备用

    result:{  //接口返回的信息
      pay_price:0, 
      recharge:0,
      point_price:0,
      member_price:0,
      coupon_price:0,
      exp_price:0
    },
    cut_num:0,  //已优惠的总额
    total_price:0,  //X
    is_member:0,  //是否会员
    is_staff:0, //是否员工
    inter_focus:false,  //积分 备用
    recharge_focus:false,  //余额 备用
    isSupport:true
  },

  onLoad:function(){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
    this.refresh()
  },

  /**
   * 刷新页面
   * order_source：订单来源、信息存储在缓存中
   * option_id：地址列表选择地址id
  */
  refresh(){
    this.setData({
      submit:false
    })
    var is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member,
      order_source = wx.getStorageSync('order_source'), source, goods_id, id, goods_num, cart,
      option_id = wx.getStorageSync('address_id_choosed')
    if (order_source.split('&').length == 4) {
      source = order_source.split('&')[0].split('=')[1],
        goods_id = order_source.split('&')[1].split('=')[1],
        id = order_source.split('&')[2].split('=')[1],
        goods_num = order_source.split('&')[3].split('=')[1]
    } else if (order_source.split('&').length == 2) {
      source = order_source.split('&')[0].split('=')[1]
      cart = order_source.split('&')[1].split('=')[1]
    }

    this.setData({
      is_staff: is_staff,
      is_member: is_member,
      source:source,
      cart: cart || false,
      goods_id: goods_id || false,
      id: id || false,
      goods_num: goods_num || false,
      options_id: option_id||false
    })
    if (option_id) {
      this.get_address()
    } else {
      this.get_address()
    }
  },

  onHide(){
    this.loading.hideLoading()
  },

  /**
   * 获取地址列表
   * 从地址列表选择了地址，则显示为选择的地址
   * 否则，有地址显示默认地址，无地址则显示“去设置收货地址”
   */
  get_address(again){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/get_user_address',
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
        console.log(res.data.data.length)
        if(res.data.status==1000){
          if (that.data.options_id){
            for (var i = 0; i < res.data.data.length; i++) {
              if (res.data.data[i].id == that.data.options_id) {
                that.setData({
                  defaultAddress: res.data.data[i]
                })
                wx.removeStorageSync('address_id_choosed')
                break
              }
            }
          }else{
            if (res.data.data.length == 1) {
              that.setData({
                defaultAddress: res.data.data[0]
              })
            }else if (res.data.data.length>1){
              for (var i = 0; i < res.data.data.length; i++) {
                console.log(res.data.data[i].is_default)
                if (res.data.data[i].is_default == 1) {
                  that.setData({
                    defaultAddress: res.data.data[i]
                  })
                  break
                }
              }
              if (!that.data.defaultAddress.contacts) {
                that.setData({
                  defaultAddress: res.data.data[0]
                })
              }
            }else{
              that.setData({
                defaultAddress: {}
              })
            }
            
          }
          that.get_price_first()
          
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_address, true)
        }else{
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail(){
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  /**
   * 点击显示 优惠券弹窗
   */
  chooseCouponTap:function(){
    if (this.data.coupon_list_id==0&&this.data.result.pay_price==0){
      app.showModal('实付款为0，不能使用优惠券！')
      return
    }
    this.setData({
      couponsShow:true
    })
  },

  /**
   * 点击 不使用优惠券
   */
  notCouponTap:function(){
    var coupon_canuse = this.data.coupon_canuse
    coupon_canuse.forEach(function(value){
      value.coupon_status=false
    })
    this.setData({
      coupon_canuse: coupon_canuse,
      coupon_list_id:0,
      couponsShow: false
    })
    this.get_price()
  },

  /**
   * 点击显示 积分兑换弹窗
   */
  integralMortgage:function(){
    if (this.data.order.points==0){
      app.showModal('可用积分为0！')
      return;
    }
    this.setData({
      interShow:true,
      points_use_back: this.data.points_use
    })
    if (!this.data.inter_focus) {
      var result = this.data.result
      result.pay_price = Number(app.numberParse(result.pay_price)) + Number(app.numberParse(this.data.points_use))
      result.pay_price = Number(result.pay_price / 100).toFixed(2)
      var last_value = app.compare(this.data.order.points, this.data.result.pay_price, this.data.result.can_use_points)
      this.setData({
        inter_last_value: last_value,
        result: result,
        inter_focus: true,
        points_use_temp: this.data.points_use
      })
    }
  },

  /**
   * 输入 积分
   */
  interInput(e){
    var val = app.trim(e.detail.value)
    this.setData({
      points_use_back:val,
      inter_warn: val != this.data.points_use_back&&''
    })
  },

  /**
   * 积分输入框聚焦
   */
  interFocus(e){
    var val = app.trim(e.detail.value)
    if (val == 0) {
      this.setData({
        points_use_back: ''
      })
    }
  },

  /**
   * 点击显示 余额兑换弹窗
   */
  balanceMortgage:function(){
    if (this.data.order.recharge==0){
      app.showModal('可用余额为0！')
      return;
    }
    this.setData({
      balanceShow:true,
      recharge_use_back: this.data.recharge_use
    })
    if (!this.data.recharge_focus) {
      var result = this.data.result
      result.pay_price = Number(app.numberParse(result.pay_price)) + Number(app.numberParse(this.data.recharge_use))
      result.pay_price = Number(result.pay_price / 100).toFixed(2)
      var last_value = app.compare(this.data.order.recharge, this.data.result.pay_price)
      this.setData({
        balance_last_value: last_value,
        result: result,
        recharge_focus: true,
        recharge_use_temp: this.data.recharge_use
      })
    }
  },

  /**
   * 输入 余额
   */
  balanceInput(e){
    var val = app.trim(e.detail.value)
    this.setData({
      recharge_use_back: val,
      balance_warn: val != this.data.recharge_use_back&& ''
    })
  },

  /**
   * 余额输入框聚焦
   */
  balanceFocus(e){
    var val = app.trim(e.detail.value)
    if(val==0){
      this.setData({
        recharge_use_back: ''
      })
    }
  },

  /**
   * 选择 优惠券
   */
  chooseCoupon:function(e){
    var list_id = e.currentTarget.dataset.list_id,
      id = e.currentTarget.dataset.id,
      coupon_canuse = this.data.coupon_canuse
    for (var i = 0; i < coupon_canuse.length;i++){
      coupon_canuse[i].coupon_status = list_id == coupon_canuse[i].coupon_list_id
    }
    this.setData({
      coupon_canuse: coupon_canuse,
      coupon_list_id: list_id,
      coupon_id:id,
      couponsShow:false
    })
    this.get_price()
  },

  //优惠券弹窗tab
  changeNavActive:function(e){
    var index=e.currentTarget.dataset.index
    this.setData({
      couponNavActive:index
    })
  },

  /**
   * 关闭 积分弹窗
   */
  closeInter:function(){
    if (this.data.inter_focus){
      var result = this.data.result
      result.pay_price = Number(app.numberParse(result.pay_price)) - Number(app.numberParse(this.data.points_use))
      result.pay_price = Number(result.pay_price / 100).toFixed(2)
      this.setData({
        result: result,
        inter_focus: false       
      })
    }
    if (this.data.recharge_focus){
      var result = this.data.result
      result.pay_price = Number(app.numberParse(result.pay_price)) - Number(app.numberParse(this.data.recharge_use))
      result.pay_price = Number(result.pay_price / 100).toFixed(2)
      this.setData({
        result: result,
        recharge_focus: false
      })
    }
    
    this.setData({
      points_use_back:0,
      recharge_use_back:0,
      interShow:false,
      balanceShow:false,
      balance_warn:'',
      inter_warn:''
    })
  },

  /**
   * 点击 积分弹窗 确认按钮
   */
  confirmInter:function(){
    if (this.data.points_use_back.length>1&&this.data.points_use_back < 0.01) {
      app.showModal('输入的值不能低于0.01')
      return
    }
    var last_value = app.compare(this.data.order.points, this.data.result.pay_price, this.data.result.can_use_points)
    var self_value = app.compare(this.data.order.points, this.data.result.pay_price)
    if (Number(this.data.points_use_back) > Number(last_value)){
      this.setData({
        inter_last_value: last_value,
        inter_warn: this.data.result.can_use_points < self_value ? ('活动期间，该订单最多可抵用' + this.data.result.can_use_points + '积分') : ('输入的值不可大于' + last_value)
      })
      return;
    }
    this.setData({
      points_use: Number(this.data.points_use_back),
      interShow:false,
      inter_focus:false,
      inter_warn: ''
    })
    this.get_price()
  },
  /**
   * 点击 余额弹窗 确认按钮
   */
  confirmBalance: function () {
    if (this.data.recharge_use_back.length>1&&this.data.recharge_use_back < 0.01) {
      app.showModal('输入的值不能低于0.01')
      return
    }
    var last_value = app.compare(this.data.order.recharge, this.data.result.pay_price)
    console.log(last_value, this.data.recharge_use_back)
    if (Number(this.data.recharge_use_back) > Number(last_value)) {
      console.log(last_value)
      this.setData({
        balance_last_value: last_value,
        balance_warn: '输入的值不可大于' + last_value
      })
      return;
    }
    this.setData({
      recharge_use: Number(this.data.recharge_use_back),
      balanceShow: false,
      recharge_focus:false,
      balance_warn: ''
    })
    this.get_price()
  },

  /**
   * 创建订单
   */
  get_data(again){
    var that=this,
      openid=wx.getStorageSync('lushang_userInfo').openid,
      session_id=wx.getStorageSync('session_id'),
      data
    if(this.data.source=='cart'){
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          cart: that.data.cart,
          source: that.data.source,
          goods_price: that.data.result.goods_price,
          province_area_code: that.data.defaultAddress.province_area_code || '0'
        }),
        openid: openid,
        session_id: session_id,
        cart: that.data.cart,
        source: that.data.source,
        goods_price: that.data.result.goods_price,
        province_area_code: that.data.defaultAddress.province_area_code || '0'
      }
    }else if(this.data.source=='goods'){
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          goods_id: that.data.goods_id,
          spec_id:that.data.id,
          goods_num: that.data.goods_num,
          source: that.data.source,
          goods_price: that.data.result.goods_price,
          province_area_code: that.data.defaultAddress.province_area_code || '0'
        }),
        openid: openid,
        session_id: session_id,
        goods_id: that.data.goods_id,
        spec_id: that.data.id,
        goods_num: that.data.goods_num,
        source: that.data.source,
        goods_price: that.data.result.goods_price,
        province_area_code: that.data.defaultAddress.province_area_code || '0'
      }
    }
    wx.request({
      url: app.globalData.link_origin + 'order_api/create_order',
      data: data,
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if(res.data.status==1000){
          var coupon_canuse = [], coupon_nouse=[]
          res.data.data.coupon.forEach(function (value, index){
            //时间转换，可以删除
            value.use_start_time = app.transferTime(+value.use_start_time).split(' ')[0]
            value.use_end_time = app.transferTime(+value.use_end_time).split(' ')[0]
            if (value.usable){
              coupon_canuse.push(value)
            }else{
              coupon_nouse.push(value)
            }
          })
          that.setData({
            order:res.data.data,
            coupon_canuse: coupon_canuse,
            coupon_nouse: coupon_nouse,
            isSupport:true
          })

          for (var i = 0; i < res.data.data.goods.length;i++){
            if (res.data.data.goods[i].area==0){
              that.setData({
                isSupport:false
              })
              break;
            }
          }

          var val = that.data.result, total = 0, cut_num = 0
          that.data.order.goods.forEach(function (value, index) {
            total += +value.price * 100 * value.goods_num
          })
          cut_num = +val.recharge * 100 + +val.point_price * 100 + (that.data.is_member == 1 ? +val.member_price * 100 : 0) + +val.coupon_price * 100
          that.setData({
            wating_pay: val.pay_price,
            cut_num: (cut_num / 100).toFixed(2),
            total_price: Number(total / 100).toFixed(2),
            final_pay: (total - cut_num + +val.exp_price * 100) / 100
          })
          that.loading.hideLoading()
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_data, true)
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

  //点击 优惠券 外侧 黑色遮罩层 关闭弹窗
  closeFull(){
    this.setData({
      couponsShow:false
    })
  },

  //点击 优惠券 内测 白色区域
  openFull(){
    this.setData({
      couponsShow: true
    })
  },

  /**
   * 首次进入页面
   */
  get_price_first(again) {
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      data
    if (this.data.source == 'cart') {
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          cart: that.data.cart,
          source: that.data.source,
          recharge: that.data.recharge_use,
          points: that.data.points_use,
          coupon_list_id: that.data.coupon_list_id,
          province_area_code: that.data.defaultAddress.province_area_code||'0'
        }),
        openid: openid,
        session_id: session_id,
        cart: that.data.cart,
        source: that.data.source,
        recharge: that.data.recharge_use,
        points: that.data.points_use,
        coupon_list_id: that.data.coupon_list_id,
        province_area_code: that.data.defaultAddress.province_area_code||'0'
      }
    } else if (this.data.source == 'goods') {
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          goods_id: that.data.goods_id,
          spec_id: that.data.id,
          goods_num: that.data.goods_num,
          source: that.data.source,
          recharge: that.data.recharge_use,
          points: that.data.points_use,
          coupon_list_id: that.data.coupon_list_id,
          province_area_code: that.data.defaultAddress.province_area_code||'0'
        }),
        openid: openid,
        session_id: session_id,
        goods_id: that.data.goods_id,
        spec_id: that.data.id,
        goods_num: that.data.goods_num,
        source: that.data.source,
        recharge: that.data.recharge_use,
        points: that.data.points_use,
        coupon_list_id: that.data.coupon_list_id,
        province_area_code: that.data.defaultAddress.province_area_code||'0'
      }
    }
    wx.request({
      url: app.globalData.link_origin + 'order_api/get_order_price',
      data: data,
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          that.setData({
            result: res.data.data,
            points: that.data.points > res.data.data.can_use_points ? res.data.data.can_use_points : that.data.points,
            points_use: that.data.points_use > res.data.data.can_use_points ? res.data.data.can_use_points : that.data.points_use,
            recharge: that.data.recharge > res.data.data.recharge ? res.data.data.recharge : that.data.recharge,
            recharge_use: that.data.recharge_use > res.data.data.recharge ? res.data.data.recharge : that.data.recharge_use
          })
          that.get_data()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_price_first, true)
        } else {
          if (res.data.status == 4007 && res.data.data.no_sale_goods_id > 0){
            that.loading.hideLoading()
            that.setData({
              result: res.data.data,
              submit: true
            })
            that.get_data()
            app.showModal(res.data.data.no_sale_goods_name+'已下架')
            return
          }
          that.setData({
            result: res.data.data,
            submit:true
          })
          that.get_data()
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

  /**
   * 非首次进入页面
   */
  get_price(again){
    this.loading.showLoading()
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      data
    if(this.data.source=='cart'){
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          cart: that.data.cart,
          source: that.data.source,
          recharge: that.data.recharge_use,
          points: that.data.points_use,
          coupon_list_id: that.data.coupon_list_id,
          province_area_code: that.data.defaultAddress.province_area_code||'0'
        }),
        openid: openid,
        session_id: session_id,
        cart: that.data.cart,
        source: that.data.source,
        recharge: that.data.recharge_use,
        points: that.data.points_use,
        coupon_list_id: that.data.coupon_list_id,
        province_area_code: that.data.defaultAddress.province_area_code||'0'
      }
    }else if(this.data.source=='goods'){
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          goods_id: that.data.goods_id,
          spec_id:that.data.id,
          goods_num: that.data.goods_num,
          source: that.data.source,
          recharge: that.data.recharge_use,
          points: that.data.points_use,
          coupon_list_id: that.data.coupon_list_id,
          province_area_code: that.data.defaultAddress.province_area_code||'0'
        }),
        openid: openid,
        session_id: session_id,
        goods_id: that.data.goods_id,
        spec_id: that.data.id,
        goods_num: that.data.goods_num,
        source: that.data.source,
        recharge: that.data.recharge_use,
        points: that.data.points_use,
        coupon_list_id: that.data.coupon_list_id,
        province_area_code: that.data.defaultAddress.province_area_code||'0'
      }
    }
    wx.request({
      url: app.globalData.link_origin + 'order_api/get_order_price',
      data: data,
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          var val = res.data.data, total = 0, cut_num=0
          that.data.order.goods.forEach(function(value,index){
            total += +value.price*100 * value.goods_num
          })
          cut_num = +val.recharge * 100 + +val.point_price * 100 + (that.data.is_member == 1 ? +val.member_price * 100: 0) + +val.coupon_price*100
          that.setData({
            wating_pay: val.pay_price,
            result: val,
            cut_num: (cut_num/100).toFixed(2),
            total_price: Number(total/100).toFixed(2),
            final_pay: (total - cut_num + +val.exp_price*100)/100,
            points: that.data.points > res.data.data.can_use_points ? res.data.data.can_use_points : that.data.points,
            points_use: that.data.points_use > res.data.data.can_use_points ? res.data.data.can_use_points : that.data.points_use,
            recharge: that.data.recharge > res.data.data.recharge ? res.data.data.recharge : that.data.recharge,
            recharge_use: that.data.recharge_use > res.data.data.recharge ? res.data.data.recharge : that.data.recharge_use
          })
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_price, true)
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

  //点击 立即支付按钮，获取消息模板form_id
  submit(e){
    this.setData({
      form_id: e.detail.formId
    })
    this.submitOrder()
  },

  //提交订单
  submitOrder(again){
    if (!this.data.defaultAddress.id) {
      app.showModal('请先设置收货地址！')
      return;
    }
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      data

    this.setData({
      submit:true
    })
    if(this.data.source=='cart'){
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          cart: that.data.cart,
          source: that.data.source,
          recharge: that.data.recharge_use,
          points: that.data.points_use,
          coupon_list_id: that.data.coupon_list_id,
          coupon_id: that.data.coupon_id,
          consignee: that.data.defaultAddress.contacts,
          province_name: that.data.defaultAddress.province,
          city_name: that.data.defaultAddress.country,
          district_name: that.data.defaultAddress.region,
          detail_address: that.data.defaultAddress.detaile_address,
          province: that.data.defaultAddress.province_area_code,
          city: that.data.defaultAddress.country_area_code,
          district: that.data.defaultAddress.region_area_code,
          address: that.data.defaultAddress.detaile_address,
          address_id: that.data.defaultAddress.id,
          mobile: that.data.defaultAddress.phone,
          form_id: that.data.form_id,
          province_area_code: that.data.defaultAddress.province_area_code || '0'
        }),
        openid: openid,
        session_id: session_id,
        cart: that.data.cart,
        source: that.data.source,
        recharge: that.data.recharge_use,
        points: that.data.points_use,
        coupon_list_id: that.data.coupon_list_id,
        coupon_id: that.data.coupon_id,
        consignee: that.data.defaultAddress.contacts,
        province_name: that.data.defaultAddress.province,
        city_name: that.data.defaultAddress.country,
        district_name: that.data.defaultAddress.region,
        detail_address: that.data.defaultAddress.detaile_address,
        province: that.data.defaultAddress.province_area_code,
        city: that.data.defaultAddress.country_area_code,
        district: that.data.defaultAddress.region_area_code,
        address: that.data.defaultAddress.detaile_address,
        address_id: that.data.defaultAddress.id,
        mobile: that.data.defaultAddress.phone,
        form_id: that.data.form_id,
        province_area_code: that.data.defaultAddress.province_area_code || '0'
      }
    }else if(this.data.source=='goods'){
      data = {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          goods_id: that.data.goods_id,
          spec_id:that.data.id,
          goods_num: that.data.goods_num,
          source: that.data.source,
          recharge: that.data.recharge_use,
          points: that.data.points_use,
          coupon_list_id: that.data.coupon_list_id,
          coupon_id: that.data.coupon_id,
          consignee: that.data.defaultAddress.contacts,
          province_name: that.data.defaultAddress.province,
          city_name: that.data.defaultAddress.country,
          district_name: that.data.defaultAddress.region,
          detail_address: that.data.defaultAddress.detaile_address,
          province: that.data.defaultAddress.province_area_code,
          city: that.data.defaultAddress.country_area_code,
          district: that.data.defaultAddress.region_area_code,
          address: that.data.defaultAddress.detaile_address,
          address_id: that.data.defaultAddress.id,
          mobile: that.data.defaultAddress.phone,
          form_id: that.data.form_id,
          province_area_code: that.data.defaultAddress.province_area_code || '0'
        }),
        openid: openid,
        session_id: session_id,
        goods_id: that.data.goods_id,
        spec_id: that.data.id,
        goods_num: that.data.goods_num,
        source: that.data.source,
        recharge: that.data.recharge_use,
        points: that.data.points_use,
        coupon_list_id: that.data.coupon_list_id,
        coupon_id: that.data.coupon_id,
        consignee: that.data.defaultAddress.contacts,
        province_name: that.data.defaultAddress.province,
        city_name: that.data.defaultAddress.country,
        district_name: that.data.defaultAddress.region,
        detail_address: that.data.defaultAddress.detaile_address,
        province: that.data.defaultAddress.province_area_code,
        city: that.data.defaultAddress.country_area_code,
        district: that.data.defaultAddress.region_area_code,
        address: that.data.defaultAddress.detaile_address,
        address_id: that.data.defaultAddress.id,
        mobile: that.data.defaultAddress.phone,
        form_id: that.data.form_id,
        province_area_code: that.data.defaultAddress.province_area_code || '0'
      }
    }
    wx.request({
      url: app.globalData.link_origin + 'order_api/saved',
      data: data,
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          that.setData({
            order_id: res.data.data.order_id
          })
          var order_source=wx.getStorageSync('order_source').split('&')[0].split('=')[1]
          if(order_source=='cart'){
            app.globalData.is_refresh = true
          }
          if(Number(that.data.result.pay_price)>0){
            that.get_order()
          }else{
            wx.redirectTo({
              url: '../payOrderSuc/payOrderSuc?order_id=' + res.data.data.order_id + '&order_sn=' + res.data.data.order_sn + '&total_fee=0.00'
            })
          }
          
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.submitOrder, true)
        } else {
          if (res.data.status == 4007 && res.data.data.no_sale_goods_id > 0) {
            that.loading.hideLoading()
            that.setData({
              submit: true
            })
            app.showModal(res.data.data.no_sale_goods_name + '已下架')
            return
          }
          that.setData({
            submit: false
          })
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.setData({
          submit: false
        })
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  get_order(again) {
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
          that.setData({
            order_infor: res.data.data
          })
          that.confirmPay()
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.pay, true)
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

  confirmPay: function (again) {
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
          duration: 500
        })
        setTimeout(function(){
          wx.redirectTo({
            url: '../payOrderSuc/payOrderSuc?order_id=' + that.data.order_id + '&order_sn='+that.data.order_infor.order_sn+'&total_fee='+that.data.order_infor.total_fee
          })
        },500)
      },
      'fail': function (res) {
        wx.showToast({
          title: '支付失败！',
          icon: 'success',
          duration: 500
        })
        setTimeout(function () {
          wx.redirectTo({
            url: '../orderDetail/orderDetail?order_id=' + that.data.order_id
          })
        }, 500)
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
  },

  onUnload(){
    var pages=getCurrentPages(),is_member=wx.getStorageSync('lushang_userInfo').is_member
    if(pages[pages.length-2].route=='pages/productDetail/productDetail'){
      pages[pages.length-2].setData({
        is_member: is_member
      })
    }
    this.loading.hideLoading()
  }
})