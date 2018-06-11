var app=getApp()
//获取屏幕高度，用于设置scroll-view高度
var winHeight, winWidth,timer,timer0,timer1
wx.getSystemInfo({
  success: function (res) {
    winWidth = res.windowWidth
    winHeight = res.windowHeight
  }
})
//引入富文本转译js
var WxParse = require('../../wxParse/wxParse.js');
//引入中国省市区js
var Area = require('../../area.js')

Page({
  data:{
    //轮播图设置
    indicatorDots: false,
    autoplay: false,
    interval: 5000,
    duration: 500,
    circular:true,
    currentIndex:1,
    //规格数量选择弹窗是否隐藏
    choices_hidden:true,
    //权益弹窗是否隐藏
    rightsShow: true,
    //规格数量选择弹窗简单动画
    animationData:{},
    //权益弹窗简单动画
    animationData1:{},
    //购物车数量简单动画
    animationData2:{},
    //地址选择弹窗简单动画
    animationData3:{},
    winHeight: winHeight,
    
    //上个页面传过来的产品id
    id:'',
    //根据页面传过来的id获取的商品信息
    product:{},
    //记录产品规格选择
    activeIndex:{},
    //是否已经选择完规格
    allChoose: true,
    //规格拼接
    spec_concat:'',
    //选择完规格后匹配的商品信息
    chooseProduct:{},
    //单个产品的数量
    product_num:1,
    //购物车数量
    cart_total:0,          
    is_staff:0,
    is_member:0,
    //数量加减是否改变
    num_change:true,
    //产品是否有规格
    has_spec:false,
    //防止“立即购买”按钮重复点击
    can_buy:true,
    //判断所选规格是否有对应的商品
    isCompared: false,
    //配送区域
    delivery_area:'请选择地址',
            

    //new
    showAddress: false,
    choose_click: false,
    address: '',
    value: [0, 0, 0],
    addArr: [],
    province: Area.area,
    city: Area.area[0].children,
    area: Area.area[0].children[0].children,
    //默认收货地址
    static_address:'',
    //是否显示 地区不支持配送 的弹窗
    no_support_show:true,
    first_enter:true,
    area_code:'',

    phone: '',
    code: '',
    get_code_status: true,
    remain_time: 60,
    coupons: [],
    register_status: true,
    show_login:false
  },

  bannerLoad(e){
    var product=this.data.product,index=e.currentTarget.dataset.index
    product.images[index].banner_show=true
    this.setData({
      product:product
    })
  },

  onLoad(options){
    /**
     * 第一次进入这个页面，弹出地址授权弹窗
     * 同意：根据小程序高德地图逆地址解析（精确度高），得到当前地址名称，精确到 区
     * 拒绝：
     *      有默认地址：展示默认地址，精确到 区
     *      无：默认展示 北京
     */
    // this.getLocation();

    var id=options.goods_id,that=this
    this.setData({
      id:id
    })
    //选取插件loading并显示
    this.loading = this.selectComponent("#loadingC");
    this.cover = this.selectComponent('#cover')
    this.loading.showLoading()

    var pages=getCurrentPages()
    if(pages.length>1){
      if (wx.getStorageSync('lushang_userInfo')) {
        var openid = wx.getStorageSync('lushang_userInfo').openid,
          is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
          is_member = wx.getStorageSync('lushang_userInfo').is_member
        that.setData({
          is_staff: is_staff,
          is_member: is_member
        })
      }
      // that.get_detail(id)
      this.allRequest()
    }else{
      // app.resetSession(this.get_detail,id)
      app.resetSession(this.allRequest)
    }
  },

  allRequest(){
    this.get_detail(this.data.id)
    this.getLocation()
  },

  setting() {
    var that = this
    wx.openSetting({
      success: (res) => {
        if (res.authSetting["scope.userInfo"]) {
          app.globalData.is_refresh=true
          app.resetSession(function(){
            var is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
              is_member = wx.getStorageSync('lushang_userInfo').is_member
            console.log('is_member=' + is_member)
            that.setData({
              is_staff: is_staff,
              is_member: is_member
            })
            that.get_detail()
            that.getLocation()
            // that.get_cart_num()
          })
        }
        that.cover.closeCover()
      }
    })
  },

  onShow(){
    console.log('onShow')
    if (wx.getStorageSync('lushang_userInfo')){
      var is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
        is_member = wx.getStorageSync('lushang_userInfo').is_member
      this.setData({
        is_staff: is_staff,
        is_member: is_member
      })
      console.log(this.data.is_member)
    }
  },

  onHide(){
    this.setData({
      choices_hidden: true
    })

    if (timer0) {
      clearInterval(timer0)
      timer0 = null
    }
    if (timer1) {
      clearInterval(timer1)
      timer1 = null
    }
  },
  
  //获取 商品详情
  get_detail(again){
    var that=this,id=this.data.id
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    wx.request({
      url: app.globalData.link_origin + 'goods_api/get_view',
      data: {
        token: app.DP({
          openid: openid,
          goods_id: id,
          session_id: session_id,
          is_staff: is_staff,
          is_member: is_member
        }),
        openid: openid,
        goods_id: id,
        session_id: session_id,
        is_staff: is_staff,
        is_member: is_member
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if(res.data.status==1000){
          //富文本转译
          var article1 = res.data.data.goods_content
          WxParse.wxParse('article1', 'html', article1, that, 5);

          //修改
          var ii = 0
          for (var i in res.data.data.spec.price) {
            if (ii == 0) {
              that.setData({
                chooseProduct: res.data.data.spec.price[i],
                product_num: res.data.data.spec.price[i].store_count > 0 ? 1 : 0,
                allChoose: res.data.data.spec.spec.length == 0 ? true : false,
                spec_concat: '',
                has_spec: res.data.data.spec.spec.length == 0 ? false : true,
                isCompared: res.data.data.spec.spec.length == 0 ? true : false
              })
              break
            }
            ii++
          }

          res.data.data.images.forEach(function(value){
            value.banner_show=false
          })

          that.setData({
            product: res.data.data
          })

          if (app.globalData.accredit){
            that.get_cart_num()
          }

          var pages = getCurrentPages()
          if (pages.length == 1) {
            that.setData({
              is_staff: is_staff,
              is_member: is_member
            })
          }

          that.loading.hideLoading()
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_detail, true)
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

  //选择规格
  chooseSpec(e){
    var parent = e.currentTarget.dataset.parent,  //该规格所属分类 下标
      index = e.currentTarget.dataset.index,   //该规格 下标
      id = e.currentTarget.dataset.id,  //该规格 id
      spec_id = e.currentTarget.dataset.spec_id,
      activeIndex = this.data.activeIndex,
      product = this.data.product

    activeIndex[parent] = id
    this.setData({
      activeIndex: activeIndex,
      num_change: true,
      isCompared: false
    })


    //创建allChoose判断规格是否已经全部选择
    var allChoose = true
    for (var i in product.spec.spec) {
      if (!activeIndex[i]) {
        allChoose = false
      }
    }


    //创建spec_concat，str拼接所选规格
    var spec_concat = [], str = ''
    if (allChoose) {
      for (var i in activeIndex) {
        spec_concat.push(activeIndex[i])
      }
      str = spec_concat.join('_')
      this.setData({
        spec_concat: str
      })

      //拿拼接完成的 spec_concat/str 与 各规格商品 匹配
      for (var i in product.spec.price) {
        if (i == str) {
          this.setData({
            chooseProduct: product.spec.price[i],
            product_num: product.spec.price[i].store_count == 0 ? 0 : 1,
            isCompared: true
          })
        }
      }
    }

    this.setData({
      allChoose: allChoose
    })
  },

  //点击 添加购物车
  addToCart:function(){
    var is_user = wx.getStorageSync('lushang_userInfo').is_user
    if (is_user == 0) {
      // wx.navigateTo({
      //   url: '../register/register',
      // })
      this.setData({
        show_login: true
      })
      return;
    }
    //处理1：没有授权
    if (!app.globalData.accredit) {
      this.cover.openCover()
      return
    }
    //处理2：员工产品，非员工不能购买
    if (this.data.product.is_staff == 1 && wx.getStorageSync('lushang_userInfo').is_staff == 0) {
      app.showModal('非员工用户不能购买员工商品！')
      return
    }
    //处理3：商品下架
    if (this.data.product.is_on_sale != 1) {
      app.showModal('该商品已下架！')
      return;
    }
    //处理4：有无规格的情况
    if (this.data.has_spec) {
      //1、处理1：没显示选择弹窗
      if (this.data.choices_hidden) {
        this.showChoicesAlert()
      } else {
        //2、处理2：已经显示选择弹窗
        if (!this.data.allChoose) {
          app.showModal('请先选择规格！')
          return
        }
        if (this.data.isCompared == false || this.data.chooseProduct.store_count == 0) {
          app.showModal('库存不足！')
          return;
        }
        this.saveCart()
      }
    } else {
      if (this.data.chooseProduct.store_count == 0) {
        app.showModal('库存不足！')
        return;
      }
      this.saveCart()
    }
  },

  //保存购物车
  saveCart(again){
    var list = this.data.cart_total.list || 0,
      chooseProduct = this.data.chooseProduct
    for (var i = 0; i < list.length; i++) {
      if (list[i].goods_id == chooseProduct.goods_id && list[i].spec_key == chooseProduct.key) {
        chooseProduct.remain = chooseProduct.store_count - list[i].goods_num
        if (chooseProduct.remain <= 0) {
          app.showModal('库存不足!')
          return;
        }
      }
    }
    this.loading.showLoading()
    var that=this
    var openid=wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    var cart = JSON.stringify([{
      goods_id: that.data.chooseProduct.goods_id,
      goods_name: that.data.product.goods_name,
      goods_price: that.data.chooseProduct.price,
      member_goods_price: that.data.chooseProduct.member_goods_price,
      spec_key_name: that.data.chooseProduct.key_name,
      goods_num: that.data.product_num,
      spec_key: that.data.chooseProduct.key
    }])
    wx.request({
      url: app.globalData.link_origin + 'goods_cart_api/saved',
      data: {
        token: app.DP({
          openid:openid,
          cart: cart,
          session_id: session_id
        }),
        openid: openid,
        cart:cart,
        session_id: session_id
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if(res.data.status==1000){
          app.globalData.is_refresh=true
          that.get_cart_num()
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.saveCart, true)
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

  //获取 购物车数量
  get_cart_num(again){
    var is_user = wx.getStorageSync('lushang_userInfo').is_user
    if(is_user==0){
      return;
    }
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      url: app.globalData.link_origin + 'goods_cart_api/get_goods_total',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id
        }),
        openid: openid,
        session_id: session_id
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if(res.data.status==1000){
          that.setData({
            cart_total: res.data.data
          })

          var animation = wx.createAnimation({
            duration: 200
          })
          that.animation = animation
          animation.scale(1.5).step()
          animation.scale(0.8).step()
          animation.scale(1).step()
          that.setData({
            animationData2: animation.export()
          })       

          that.loading.hideLoading()
        }else if(!again&&res.data.status==4004){
          app.resetSession(that.get_cart_num, true)
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

  //点击 -
  reduceTap:function(){
    var product_num = this.data.product_num
    if (product_num>1){
      this.setData({
        product_num: --this.data.product_num,
        num_change:true
      })
    }else{
      app.showModal('购买数量至少为1！')
    }
  },

  //点击 +
  addTap: function () {
    var product_num = this.data.product_num
    if (product_num >= this.data.chooseProduct.store_count){
      app.showModal('库存不足！')
    }else{
      this.setData({
        product_num: ++this.data.product_num,
        num_change: true
      })
    }
    
  },

  //滑动 轮播图
  swiperChange:function(e){
    this.setData({
      currentIndex: e.detail.current + 1
    })
  },

  //显示 商品规格弹窗
  showChoicesAlert:function(){
    this.setData({
      choices_hidden:false,
      product_num: this.data.product_num > 1 ? this.data.product_num : this.data.chooseProduct.store_count==0?0:1
    })
    var animation = wx.createAnimation({
      duration: 400
    })
    this.animation = animation
    animation.translateY('0px').step()
    this.setData({
      animationData: animation.export()
    })
  },

  //关闭 商品规格弹窗
  closeChoicesAlert:function(){
    this.setData({
      choices_hidden:true
    })
    var animation = wx.createAnimation({
      duration: 400
    })
    this.animation = animation
    animation.translateY('-20px').step()
    this.setData({
      animationData: animation.export()
    })
  },

  openChoicesAlert(){},

  showRightsAlert() {
    this.setData({
      rightsShow: false
    })
    var animation = wx.createAnimation({
      duration: 200
    })
    this.animation = animation
    animation.translateY('0px').step()
    this.setData({
      animationData1: animation.export()
    })
  },

  closeRightsTap() {
    var animation = wx.createAnimation({
      duration: 200
    })
    this.animation = animation
    animation.translateY('290px').step()
    this.setData({
      animationData1: animation.export()
    })
    setTimeout(()=>{
      this.setData({
        rightsShow: true
      })
    },200)
  },

  openRightsTap(){},

  //回到 首页
  backToIndexTap:function(){
    wx.switchTab({
      url:'../index/index'
    })
  },

  //跳转 购物车页面
  goCartTap:function(){
    wx.switchTab({
      url: '../cart/cart'
    })
  },

  goSubmitPage(again){
    var is_user = wx.getStorageSync('lushang_userInfo').is_user
    if (is_user == 0) {
      // wx.navigateTo({
      //   url: '../register/register',
      // })
      this.setData({
        show_login: true
      })
      return;
    }
    //处理1：没有授权
    if (!app.globalData.accredit) {
      this.cover.openCover()
      return
    }
    //处理2：员工产品，非员工不能购买
    if (this.data.product.is_staff == 1 && wx.getStorageSync('lushang_userInfo').is_staff == 0) {
      app.showModal('非员工用户不能购买员工商品！')
      //this.toast.showToast('非员工用户不能购买员工商品！')
      return
    }
    //处理3：商品下架
    if (this.data.product.is_on_sale != 1) {
      app.showModal('该商品已下架！')
      //this.toast.showToast('该商品已下架！')
      return;
    }
    if (this.data.has_spec) {//有规格
      if (!this.data.choices_hidden) {//规格弹窗显示
        this.checkBeforeSubmit()
      } else if (this.data.choices_hidden) {//规格弹窗不显示
        this.showChoicesAlert()
      }
    } else {//无规格
      this.checkBeforeSubmit()
    }
  },

  checkBeforeSubmit(again){
    var is_user = wx.getStorageSync('lushang_userInfo').is_user
    if (is_user == 0) {
      // wx.navigateTo({
      //   url: '../register/register'
      // })
      this.setData({
        show_login:true
      })
    } else if (is_user == 1) {

      if (!this.data.allChoose) {
        app.showModal('请先选择规格!')
        return
      }
      if (this.data.isCompared == false || this.data.chooseProduct.store_count == 0) {
        app.showModal('库存不足！')
        return;
      }
      if (this.data.product_num > this.data.chooseProduct.store_count) {
        app.showModal('库存不足！')
        return;
      }
      this.setData({
        can_buy: false
      })

      //修改
      wx.setStorageSync('order_source', 'source=goods&goods_id=' + this.data.chooseProduct.goods_id + '&id=' + this.data.chooseProduct.id + '&goods_num=' + this.data.product_num)

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
    }
  },

  preview(e){
    var src=e.currentTarget.dataset.src,arr=[]
    this.data.product.images.forEach(function(value){
      arr.push(value.image_url)
    })
    wx.previewImage({
      current: src, // 当前显示图片的http链接
      urls: arr // 需要预览的图片http链接列表
    })
  },

  goVipPage(){
    if (!app.globalData.accredit) {
      this.cover.openCover()
      return
    }
    var is_user=wx.getStorageSync('lushang_userInfo').is_user
    if(is_user==0){
      // wx.navigateTo({
      //   url: '../register/register',
      // })
      this.setData({
        show_login:true
      })
      return
    }
    wx.navigateTo({
      url:'../becomeVip/becomeVip'
    })
  },

  onShow(){
    this.setData({
      can_buy:true
    })
  },

  //页面分享
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      console.log(res.target)
    }
    return {
      title: app.globalData.share_title,
      path: '/pages/productDetail/productDetail?goods_id='+this.data.id,
      success: function (res) { },
      fail: function (res) { }
    }
  },

  onUnload(){
    this.loading.hideLoading()
  },

  

  //是否地址授权
  getLocation(again) {
    var that = this;
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        console.log(res)
        wx.setStorageSync('location', res.latitude + ',' + res.longitude)
        var openid = wx.getStorageSync('lushang_userInfo').openid,
          session_id = wx.getStorageSync('session_id'),
          is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
          is_member = wx.getStorageSync('lushang_userInfo').is_member
        wx.request({
          method: 'POST',
          url: app.globalData.link_origin + 'goods_api/check_location',
          data: {
            token: app.DP({
              openid: openid,
              session_id: session_id,
              goods_id: that.data.id,
              location: res.latitude + ',' + res.longitude,
              area_code: '',
              is_staff: is_staff,
              is_member: is_member
            }),
            openid: openid,
            session_id: session_id,
            goods_id: that.data.id,
            location: res.latitude + ',' + res.longitude,
            area_code: '',
            is_staff: is_staff,
            is_member: is_member
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success: function (res) {
            console.log(res)
            if (res.data.status == 1000) {
              var result = res.data.data, product = that.data.product
              product.spec = result.spec
              if (result.status == 0) {
                that.setData({
                  no_support_show: result.status == 0 ? true : false,
                  first_enter:false
                })
              } else {
                that.setData({
                  no_support_show: result.status == 0 ? true : false,
                  product: product,
                  first_enter: false
                })
              }
              var store = {
                province: result.province,
                city: result.city,
                area: result.area
              }, value = []
              for (var i = 0; i < Area.area.length; i++) {
                if (Area.area[i].area_name == store.province) {
                  value[0] = i
                  for (var j = 0; j < Area.area[i].children.length; j++) {
                    if (Area.area[i].children[j].area_name == store.city) {
                      value[1] = j
                      for (var k = 0; k < Area.area[i].children[j].children.length; k++) {
                        if (Area.area[i].children[j].children[k].area_name == store.area) {
                          value[2] = k
                          break;
                        }
                      }
                    }
                  }
                }
              }
              that.setData({
                //修改
                value: value,
                province: Area.area,
                city: Area.area[value[0]].children,
                area: Area.area[value[0]].children[value[1]].children,
                showAddress: false,
                delivery_area: result.province + ',' + result.city + ',' + result.area
              })
            } else if (!again && res.data.status == 4004) {
              app.resetSession(that.getLocation, true)
            } else {
              app.showModal(res.data.msg)
              that.staticLocation()
            }
          },
          fail:function(res){
            app.showModal('连接超时！')
            that.staticLocation()
          }
        })
      },
      fail(){
        var is_user = wx.getStorageSync('lushang_userInfo').is_user
        if (is_user==0){
          that.staticLocation()
        } else if (is_user == 1){
          that.get_address()
        }else{
          that.staticLocation()
        }
      }
    })
  },

  staticLocation(){
    this.setData({
      delivery_area: '北京',
      no_support_show:false,
      showAddress: false,
      first_enter: false,
      value: [0, 0, 0],
      province: Area.area,
      city: Area.area[0].children,
      area: Area.area[0].children[0].children
    })
  },

  get_address(again) {
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
            var is_default = false
            res.data.data.forEach(function (value) {
              if (value.is_default == 1) {
                that.setData({
                  delivery_area: value.province + ',' + value.country + ',' + value.region,
                  static_address: value,
                  area_code: value.province_area_code
                })
                is_default = true
              }
            })
            if (!is_default) {
              var value = res.data.data[0]
              that.setData({
                delivery_area: value.province + ',' + value.country + ',' + value.region,
                static_address: value,
                area_code: value.province_area_code
              })
            }
          } else {
            //没有收货地址
            that.staticLocation()
          }
          that.changeAddress()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_address, true)
        } else {
          that.staticLocation()
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.staticLocation()
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  changeAddress(again){
    var that=this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      location = wx.getStorageSync('location'),
      is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'goods_api/check_location',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          goods_id: that.data.id,
          location: location,
          area_code: that.data.area_code,
          is_staff: is_staff,
          is_member: is_member
        }),
        openid: openid,
        session_id: session_id,
        goods_id: that.data.id,
        location: location,
        area_code: that.data.area_code,
        is_staff: is_staff,
        is_member: is_member
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        console.log(res)
        if (res.data.status == 1000) {
          var result = res.data.data, product = that.data.product
          product.spec = result.spec
          if (result.status == 0){
            that.setData({
              no_support_show: result.status == 0 ? true : false,
              first_enter: false
            })
          }else{
            that.setData({
              no_support_show: result.status == 0 ? true : false,
              product: product,
              first_enter: false
            })
          }
          if (that.data.chooseProduct.store_count < that.data.product_num){
            that.setData({
              product_num: that.data.chooseProduct.store_count
            })
          }
          that.loading.hideLoading()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.changeAddress, true)
        } else {
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail: function (res) {
        that.loading.hideLoading()
        app.showModal('连接超时！')
      }
    })
  },

  chooseAddress(e) {
    if (this.data.delivery_area == '北京') {
      this.setData({
        showAddress: true,
        value: [0, 0, 0],
        province: Area.area,
        city: Area.area[0].children,
        area: Area.area[0].children[0].children
      })
    } else if (typeof this.data.static_address=='object') {
      var store = e.currentTarget.dataset.item, value = []
      console.log(store)
      for (var i = 0; i < Area.area.length; i++) {
        if (Area.area[i].area_name == store.province) {
          value[0] = i
          for (var j = 0; j < Area.area[i].children.length; j++) {
            if (Area.area[i].children[j].area_name == store.country) {
              value[1] = j
              for (var k = 0; k < Area.area[i].children[j].children.length; k++) {
                if (Area.area[i].children[j].children[k].area_name == store.region) {
                  value[2] = k
                  break;
                }
              }
            }
          }
        }
      }
      this.setData({
        //修改
        value: value,
        province: Area.area,
        city: Area.area[value[0]].children,
        area: Area.area[value[0]].children[value[1]].children,
        showAddress: true
      })
    } else {
      this.setData({
        showAddress: true
      })
    }
    var animation = wx.createAnimation({
      duration: 200
    })
    this.animation = animation
    animation.translateY('0px').step()
    this.setData({
      animationData3: animation.export()
    })
    wx.setStorageSync('Area_temp_value', this.data.value)
  },

  confirmAddress() {
    var animation = wx.createAnimation({
      duration: 200
    })
    this.animation = animation
    animation.translateY('300px').step()
    var Add = Area.area, arr = this.data.value
    this.setData({
      animationData3: animation.export(),
      area_code: Add[arr[0]].area_code
    })
    console.log(this.data.area_code)
    this.loading.showLoading()
    this.changeAddress()
    setTimeout(() => {
      this.setData({
        showAddress: false,
        delivery_area: Add[arr[0]].area_name +','+ Add[arr[0]].children[arr[1]].area_name +','+ Add[arr[0]].children[arr[1]].children[arr[2]].area_name
      })
    }, 200)
  },
  cancelAddress(){
    var animation = wx.createAnimation({
      duration: 200
    })
    this.animation = animation
    animation.translateY('300px').step()
    this.setData({
      animationData3: animation.export()
    })
    setTimeout(()=>{
      var value = wx.getStorageSync('Area_temp_value')
      this.setData({
        showAddress: false,
        value: value,
        province: Area.area,
        city: Area.area[value[0]].children,
        area: Area.area[value[0]].children[value[1]].children
      })
      
    },200)
  },

  openAddress(){},

  bindChange: function (e) {
    var addArr = this.data.value
    const val = e.detail.value
    var area
    if (Area.area[val[0]].children[val[1]]) {
      area = Area.area[val[0]].children[val[1]].children
    } else {
      area = Area.area[val[0]].children[0].children
    }
    this.setData({
      city: Area.area[val[0]].children,
      area: area,
      value: val,
      addArr: addArr
    })
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
        type: 2
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          res.data.data.forEach(function (value) {
            value.use_start_time = app.transferTime(value.use_start_time).split(' ')[0]
            value.use_end_time = app.transferTime(value.use_end_time).split(' ')[0]
          })
          that.setData({
            coupons: res.data.data
          })
          setTimeout(function () {
            that.loading.hideLoading()
          }, 1000)
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

  phoneInput(e) {
    var phone = e.detail.value
    this.setData({
      phone: app.trim(phone)
    })
  },
  codeInput(e) {
    var code = e.detail.value
    this.setData({
      code: app.trim(code)
    })
  },

  //获取验证码
  getCode(again) {
    var phone = this.data.phone
    if (phone.length != 11 || !/^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/.test(phone)) {
      app.showModal('输入的手机号有误！')
      return;
    }

    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/send_code',
      data: {
        token: app.DP({
          openid: openid,
          mobile: that.data.phone,
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
        if (res.data.status == 1000) {
          that.setData({
            get_code_status: false
          })
          wx.showToast({
            title: '已发送！',
            icon: 'success',
            duration: 2000
          })
          timer0 = setTimeout(function () {
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
        } else if (!again && res.data.status == 4004) {
          that.setData({
            get_code_status: true
          })
          app.resetSession(that.getCode, true)
        } else {
          that.setData({
            get_code_status: true
          })
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.setData({
          get_code_status: true
        })
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  //领取红包
  registerTap(again) {
    if (!this.data.code.length) {
      app.showModal('请先输入验证码!')
      return;
    }
    this.setData({
      register_status: false
    })
    var that = this
    var userInfo = wx.getStorageSync('userInfo'),
      openid = wx.getStorageSync('lushang_userInfo').openid,
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
        source: 'shop',
        mobile: that.data.phone,
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
        if (res.data.status == 1000) {
          wx.showToast({
            title: '登录成功！',
            icon: 'success',
            duration: 2000
          })
          app.globalData.is_refresh = true
          app.resetSession(function () {
            var pages = getCurrentPages()
            if (pages[pages.length - 1].route == 'pages/productDetail/productDetail') {
              pages[pages.length - 1].get_cart_num()
              var is_member = wx.getStorageSync('lushang_userInfo').is_member,
                is_staff = wx.getStorageSync('lushang_userInfo').is_staff
              pages[pages.length - 1].setData({
                is_member: is_member,
                is_staff: is_staff
              })
            }
            that.setData({
              show_login:false
            })
          })
        } else if (!again && res.data.status == 4004) {
          that.setData({
            register_status: true
          })
          app.resetSession(that.registerTap, true)
        } else {
          that.setData({
            register_status: true
          })
          that.loading.hideLoading()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.setData({
          register_status: true
        })
        that.loading.hideLoading()
        app.showModal('请求超时！')
      }
    })
  },

  closeLogin(){
    this.setData({
      show_login:false
    })
  }
})