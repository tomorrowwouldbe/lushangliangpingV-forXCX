var app = getApp()
/*
*winHeight:屏幕可用高度
*platform:是否是iphone
*timer:定时器-判断是否可以拿到openid
**/
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
    winHeight: winHeight, //屏幕高度
    platform: platform, //手机型号
    chooseAll: false,//是否全选
    canEdit: false,//是否可以编辑
    cartList: [], //购物车列表
    choosedNum: 1,  //是否已经选中
    num_change: false,  //编辑状态下 数量是否已经改变
    total: 0.00, //总计
    is_staff: 0,  //是否 员工
    is_member: 0, //是否 会员
    vip_cut: 0, //会员免减多少
    xiaDan_click: false,  //下单按钮 是否可以点击
    status:'',  //是否是登录状态
    go_productDetail: true //是否可以点击去商祥页面
  },

  onLoad() {
    this.loading = this.selectComponent('#loadingC')
    this.cover = this.selectComponent('#cover')
    this.loading.showLoading()
    this.refresh()
  },

  //接收is_refresh看商品详情页是否已经点击加入购物车 与 提交订单页面 是否已经下单  注册页面是否已经注册成功
  onShow: function () {
    if (!app.globalData.accredit) {
      this.cover.openCover()
      return
    } else {
      this.cover.closeCover()
    }
    if (app.globalData.is_refresh==true){
      this.loading.showLoading()
      this.refresh()
    }
    this.setData({
      xiaDan_click: false,
      go_productDetail:true
    })
  },

  onHide() {
    this.loading.hideLoading()
  },

  setting() {
    var that = this
    wx.openSetting({
      success: (res) => {
        if (res.authSetting["scope.userInfo"]) {
          that.cover.closeCover()
          that.loading.showLoading()
          app.globalData.accredit = true
          app.resetSession(that.refresh)
        }
      }
    })
  },

  //重置数据
  refresh(){
    this.setData({
      xiaDan_click: false,
      canEdit:false,
      choosedNum:1
    })
    var that = this
    if (wx.getStorageSync('lushang_userInfo')){
      var is_user = wx.getStorageSync('lushang_userInfo').is_user,
        is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
        is_member = wx.getStorageSync('lushang_userInfo').is_member
      if (is_user == 0) {
        that.setData({
          status: 'unregisted'
        })
        that.loading.hideLoading()
      } else if (is_user == 1) {
        that.setData({
          status: 'registed'
        })
        that.setData({
          is_staff: is_staff,
          is_member: is_member
        })
        that.get_list()
      }
    }else{
      this.loading.hideLoading()
    }
  },


  //点击 注册 按钮
  goRegisterTap() {
    wx.navigateTo({
      url: '../register/register',
    })
  },

  //获取 购物车列表
  get_list(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      url: app.globalData.link_origin + 'goods_cart_api/get_list',
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
          that.setData({
            cartList: res.data.data
          })
          app.globalData.is_refresh=false
          that.calcAll()
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_list, true)
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

  //计算 勾选的产品 金额
  calcAll: function () {
    var cartList = this.data.cartList, total = 0, member_total = 0,
      chooseAll = this.data.chooseAll,
      is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    if (cartList.length > 0) {
      cartList.forEach(function (value, index) {
        var calc_p = 0, mem_p = 0
        if (value.is_staff == 0) {
          calc_p = is_member == 0 ? value.price : value.member_goods_price > 0 ? value.member_goods_price : value.price
          mem_p = value.member_goods_price > 0 ? value.member_goods_price : value.price
          total += Number(calc_p * 100 * value.goods_num)
          member_total += Number(mem_p * 100 * value.goods_num)
        } else if (value.is_staff == 1) {
          calc_p = is_member == 0 ? value.staff_price > 0 ? value.staff_price : value.price : value.member_goods_price > 0 ? value.member_goods_price : value.staff_price > 0 ? value.staff_price : value.price
          mem_p = value.member_goods_price > 0 ? value.member_goods_price : value.staff_price > 0 ? value.staff_price : value.price
          total += Number(calc_p * 100 * value.goods_num)
          member_total += Number(mem_p * 100 * value.goods_num)
        }
        value.isChoosed = true
        chooseAll = true
      })
    } else {
      total = 0
      chooseAll = false
    }
    this.setData({
      cartList: cartList,
      total: Number(total / 100).toFixed(2),
      vip_cut: Number(total / 100 - member_total / 100).toFixed(2),
      chooseAll: chooseAll
    })
    wx.stopPullDownRefresh()
  },

  //点击 单个产品 勾选按钮
  cartItemtap: function (e) {
    var that = this
    var id = e.currentTarget.id
    var cartList = this.data.cartList, total = Number(this.data.total * 100),
      canEdit = this.data.canEdit
    var choosedNum = 0,
      is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    cartList.forEach(function (value, index) {
      if (value.id == id) {
        value.isChoosed = !value.isChoosed
        var calc_p = 0
        if (value.is_staff == 0) {//会员商城产品  
          calc_p = is_member == 0 ? value.price : value.member_goods_price > 0 ? value.member_goods_price : value.price
        } else if (value.is_staff == 1) {//员工内购产品
          calc_p = is_member == 0 ? value.staff_price > 0 ? value.staff_price : value.price : value.member_goods_price > 0 ? value.member_goods_price : value.staff_price > 0 ? value.staff_price : value.price
        }
        if (!canEdit && value.isChoosed) {
          total += Number(calc_p * 100 * value.goods_num)
        } else if (!canEdit && !value.isChoosed) {
          total -= calc_p * 100 * value.goods_num
        }
      }
      if (value.isChoosed)
        choosedNum++
    })

    this.setData({
      cartList: cartList,
      chooseAll: choosedNum == cartList.length,
      total: Number(total / 100).toFixed(2),
      choosedNum: choosedNum
    })
  },

  //点击 全选 按钮
  chooseAllTap: function () {
    var that = this
    var cartList = this.data.cartList, total = Number(this.data.total * 100),
      canEdit = this.data.canEdit,
      is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    cartList.forEach(function (value, index) {
      value.isChoosed = that.data.chooseAll ? false : true
      if (!canEdit && that.data.chooseAll) {
        total = 0
      } else if (!canEdit) {
        var calc_p = 0
        if (value.is_staff == 0) {//会员商城产品  
          calc_p = is_member == 0 ? value.price : value.member_goods_price > 0 ? value.member_goods_price : value.price
        } else if (value.is_staff == 1) {//员工内购产品
          calc_p = is_member == 0 ? value.staff_price > 0 ? value.staff_price : value.price : value.member_goods_price > 0 ? value.member_goods_price : value.staff_price > 0 ? value.staff_price : value.price
        }
        total += Number(calc_p * 100 * value.goods_num)
      }
    })

    this.setData({
      cartList: cartList,
      chooseAll: !this.data.chooseAll,
      choosedNum: !this.data.chooseAll,
      total: Number(total / 100).toFixed(2)
    })
    // this.calcAll()
  },

  //点击 编辑 按钮
  editTap: function () {
    var that = this,
      cartList = this.data.cartList
    cartList.forEach(function (value, index) {
      value.isChoosed = false
    })
    this.setData({
      canEdit: true,
      chooseAll: false,
      choosedNum: 0,
      cartList: cartList
    })
  },

  //点击 - 按钮
  reduceTap: function (e) {
    var that=this
    var id = e.currentTarget.id, cartList = this.data.cartList
    cartList.forEach(function (value, index) {
      if (value.id == id) {
        if (value.goods_num > 1) {
          value.goods_num--
        } else {
          app.showModal('商品数量不可低于1件!')
          return;
        }
      }
    })
    this.setData({
      cartList: cartList,
      num_change: true
    })
  },

  //点击 + 按钮
  addTap: function (e) {
    var that=this
    var id = e.currentTarget.id, cartList = this.data.cartList
    cartList.forEach(function (value, index) {
      if (value.id == id) {
        value.goods_num++
        // if (+value.goods_num < +value.store_count) {
        //   value.goods_num++
        // } else {
        //   app.showModal('该商品库存只有' + value.store_count + '件')
        //   return;
        // }
      }
    })
    this.setData({
      cartList: cartList,
      num_change: true
    })
  },

  //点击 完成 按钮
  confirmEditTap: function () {
    var cartList = this.data.cartList,that=this
    // for (var i = 0; i < cartList.length; i++) {
    //   if (Number(cartList[i].goods_num) > Number(cartList[i].store_count)) {
    //     app.showModal(cartList[i].goods_name + cartList[i].spec_key_name + '库存仅剩' + cartList[i].store_count)
    //     return
    //   }
    // }
    var cartList = this.data.cartList
    cartList.forEach(function (value, index) {
      value.isChoosed = true
    })
    this.setData({
      canEdit: false,
      cartList: cartList,
      chooseAll: true,
      choosedNum: cartList.length
    })
    this.calcAll()
    if (!this.data.num_change) {
      return;
    }
    this.save_cart()
    this.setData({
      num_change: false
    })
  },

  //点击 成为会员
  goVipPage() {
    wx.navigateTo({
      url: '../becomeVip/becomeVip'
    })
  },

  //可编辑状态：点击 完成 保存购物车
  save_cart(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    var cartList = this.data.cartList, postCart = []
    cartList.forEach(function (value, index) {
      postCart.push({
        id: value.id,
        goods_id: value.goods_id,
        goods_num: value.goods_num,
        spec_key: value.spec_key
      })
    })
    postCart = JSON.stringify(postCart)
    wx.request({
      url: app.globalData.link_origin + 'goods_cart_api/saved',
      data: {
        token: app.DP({
          openid: openid,
          cart: postCart,
          session_id: session_id
        }),
        openid: openid,
        cart: postCart,
        session_id: session_id
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {

        } else if (!again && res.data.status == 4004) {
          app.restSession(that.save_cart, true)
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

  //点击 删除 按钮
  deleteTap() {
    var that = this
    var cartList = this.data.cartList, hasChoosed = false
    for (var i = 0; i < cartList.length; i++) {
      if (cartList[i].isChoosed) {
        hasChoosed = true
        break
      }
    }
    if (!hasChoosed) {
      app.showModal('请先选择要删除的商品！')
      return;
    }
    wx.showModal({
      title: '温馨提示',
      content: '确认删除所选商品？',
      cancelColor: '#999999',
      confirmColor: '#cf2122',
      success: function (res) {
        if (res.confirm) {
          that.deleteProduct()
        } else if (res.cancel) {
        }
      }
    })
  },

  //删除 商品
  deleteProduct: function (again) {
    var cartList = this.data.cartList, deleteArr = [],
      total = Number(this.data.total * 100)
    cartList.forEach(function (value, index) {
      if (value.isChoosed) {
        deleteArr.push({
          id: value.id,
          goods_id: value.goods_id,
          act: 'del',
          goods_num: value.goods_num,
          spec_key: value.spec_key
        })
      }
    })
    deleteArr = JSON.stringify(deleteArr)
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    var that = this
    wx.request({
      url: app.globalData.link_origin + 'goods_cart_api/saved',
      data: {
        token: app.DP({
          openid: openid,
          cart: deleteArr,
          session_id: session_id
        }),
        openid: openid,
        cart: deleteArr,
        session_id: session_id
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          wx.request({
            url: app.globalData.link_origin + 'goods_cart_api/get_list',
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
              if (res.data.status = 1000) {
                that.setData({
                  cartList: res.data.data
                })
                that.calcAll()
              } else {
                that.loading.hideLoading()
                app.showModal(res.data.msg, true)
              }
            },
            fail(res) {
              that.loading.hideLoading()
              app.showModal('请求超时！')
            }
          })
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.deleteProduct)
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


  //点击 下单 按钮
  xiaDanTap: function () {
    var cartList = this.data.cartList, hasChoosed = false, choosedArr = []
    for (var i = 0; i < cartList.length; i++) {
      if (cartList[i].isChoosed) {
        hasChoosed = true
        choosedArr.push(cartList[i].id)
      }
    }
    if (!hasChoosed) {
      app.showModal('请先选择要下单的商品!')
      return;
    }

    var arr=[]
    for (var i = 0; i < cartList.length;i++){
      if (cartList[i].isChoosed&&cartList[i].is_on_sale!=1){
        arr.push(cartList[i].goods_name)
      }
    }
    var str=arr.join(',')
    if(str.length>0){
      app.showModal(str+'已下架，请修改产品为不选中!')
      return;
    }

    // for (var i = 0; i < cartList.length; i++) {
    //   if (cartList[i].isChoosed &&Number(cartList[i].goods_num) > Number(cartList[i].store_count)) {
    //     app.showModal(cartList[i].goods_name + cartList[i].spec_key_name + '库存仅剩' + cartList[i].store_count)
    //     return
    //   }
    // }
    this.setData({
      xiaDan_click: true
    })
    // wx.navigateTo({
    //   url: '../submitOrder/submitOrder'
    // })

    var str = choosedArr.join(',')
    wx.setStorageSync('order_source', 'source=cart&cart=' + str)

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
        if (res.data.status == 1000) {
          //有收货地址
          if (res.data.data.length > 0) {
            wx.navigateTo({
              url: '../submitOrder/submitOrder'
            })
          } else {
            //没有收货地址
            wx.navigateTo({
              url: '../receiveAddrList/receiveAddrList?type=new'
            })
          }
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_address, true)
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

  //点击 产品 查看详情
  goPageDetail: function (e) {
    var id = e.currentTarget.dataset.id,
      order_id = e.currentTarget.dataset.order_id,
      go_productDetail = this.data.go_productDetail,
      cartList = this.data.cartList
    for (var i = 0; i < cartList.length;i++){
      if (order_id == cartList[i].id && cartList[i].is_on_sale!=1){
        this.setData({
          no_sale:true
        })
        return
      }
    }
    if (go_productDetail){
      this.setData({
        go_productDetail:false
      })
      wx.navigateTo({
        url: '../productDetail/productDetail?goods_id=' + id
      })
    }
  },

  //关闭 商品已下架 弹窗
  closeNoTap(){
    this.setData({
      no_sale:false
    })
  },

  //回到 首页
  goHome() {
    wx.switchTab({
      url: '../index/index',
    })
  },

  onUnload() {
    this.loading.hideLoading()
  }
})