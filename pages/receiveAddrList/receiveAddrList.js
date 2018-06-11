var app=getApp()
var Area = require('../../area.js')
Page({
  data:{
    //list
    list:[],
    defaultAddress:{},
    id:'',

    //new
    showAddress: false,
    choose_click:false,
    address: '',
    value: [0, 0, 0],
    addArr: [],
    province: {},
    city: {},
    area: {},
    name: '',
    phone: '',
    detail: '',

    page_status:'list',//页面显示列表、新增、编辑
    animationData:{}
  },
  onLoad(options){
    this.loading = this.selectComponent("#loadingC");
    this.loading.showLoading()
    this.setData({
      page_status:options.type||'list'
    })
    if (this.data.page_status == 'new') {
      wx.setNavigationBarTitle({
        title: '新增地址'
      })
    }
    if (this.data.page_status=='list'){
      this.get_address(false)
    }else if(this.data.page_status=='new'){
      this.setData({
        province: Area.area,
        city: Area.area[0].children,
        area: Area.area[0].children[0].children
      })
      this.loading.hideLoading()
    }
    
  },
  //page_status=='list'
  get_address(again,fn) {
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
          if(res.data.data.length==1){
            if (res.data.data[0].is_default==2){
              res.data.data[0].is_default = 1
              that.setStaticTap(res.data.data[0].id)
            }
          }
          that.setData({
            list:res.data.data
          })
          if (typeof fn == "function")
            fn(false)
          that.loading.hideLoading()
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
  setStaticTap(e){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      id = e>0?e:e.currentTarget.dataset.id
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/save_user_address',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          id: id,
          is_default: 1
        }),
        openid: openid,
        session_id: session_id,
        id: id,
        is_default: 1
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          if(e>0){

          }else{
            app.showModal('设置默认地址成功！')
            that.get_address(false)
            var pages=getCurrentPages()
            pages[pages.length-2].refresh()
          }
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
  goEditTap(e){
    this.setData({
      page_status:'edit',
      choose_click:true
    })
    wx.setNavigationBarTitle({
      title: '编辑地址'
    })
    var store = e.currentTarget.dataset.item, value = []
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
      name: store.contacts,
      phone: store.phone,
      detail: store.detaile_address,
      id: store.id,
      is_default: store.is_default,
      //修改
      address: store.province + store.country + store.region,
      value: value,
      province: Area.area,
      city: Area.area[value[0]].children,
      area: Area.area[value[0]].children[value[1]].children
    })
    this.loading.hideLoading()
  },
  deleteTap(e){
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      id = e.currentTarget.dataset.id
    wx.request({
      method: 'POST',
      url: app.globalData.link_origin + 'member_api/del_user_address',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          id: id
        }),
        openid: openid,
        session_id: session_id,
        id: id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.status == 1000) {
          wx.showToast({
            title: '删除成功！',
            icon: 'success',
            duration: 2000
          })
          that.get_address(false)
          var pages = getCurrentPages()
          pages[pages.length - 2].refresh()
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
  setDefaultAddress(e){
    var id = e.currentTarget.dataset.id
    this.setData({
      id:id
    })
    // var a = wx.getStorageSync('order_source')
    // wx.redirectTo({
    //   url:'../submitOrder/submitOrder?default='+id+'&'+a
    // })
    wx.setStorageSync('address_id_choosed', id)
    var pages=getCurrentPages()
    pages[pages.length - 2].refresh()
    wx.navigateBack({
      delta:1
    })
  },

  //点击 "新增收货地址"
  newAddrTap(){
    this.setData({
      name: '',
      phone: '',
      detail: '',
      id: 0,
      is_default: 2,
      address: '',
      value: [0,0,0],
      page_status: 'new',
      province: Area.area,
      city: Area.area[0].children,
      area: Area.area[0].children[0].children
    })
    wx.setNavigationBarTitle({
      title: '新增地址'
    })
    // this.setData({
    //   page_status: 'new',
    //   province: Area.area,
    //   city: Area.area[0].children,
    //   area: Area.area[0].children[0].children
    // })
  },

  //new
  chooseAddress() {
    this.setData({
      showAddress: true,
      choose_click: true
    })
    wx.setStorageSync('Area_temp_value', this.data.value)
    var animation = wx.createAnimation({
      duration: 200
    })
    this.animation = animation
    animation.translateY('0px').step()
    this.setData({
      animationData: animation.export()
    })
  },

  confirmAddress() {
    var animation = wx.createAnimation({
      duration: 200
    })
    this.animation = animation
    animation.translateY('300px').step()
    this.setData({
      animationData: animation.export()
    })
    setTimeout(() => {
      var Add = Area.area, arr = this.data.value
      this.setData({
        showAddress: false,
        address: Add[arr[0]].area_name + Add[arr[0]].children[arr[1]].area_name + Add[arr[0]].children[arr[1]].children[arr[2]].area_name
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
      animationData: animation.export()
    })
    setTimeout(() => {
      var value = wx.getStorageSync('Area_temp_value')
      this.setData({
        showAddress: false,
        value: value,
        province: Area.area,
        city: Area.area[value[0]].children,
        area: Area.area[value[0]].children[value[1]].children
      })
    }, 200)
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

  nameInput(e) {
    this.setData({
      name: app.trim(e.detail.value)
    })
  },
  phoneInput(e) {
    this.setData({
      phone: app.trim(e.detail.value)
    })
  },
  detailInput(e) {
    this.setData({
      detail: app.trim(e.detail.value)
    })
  },


  sucTap(again) {
    if (this.data.name.length == 0) {
      app.showModal('收货人姓名不能为空！')
      return;
    }
    if (this.data.choose_click==false){
      app.showModal('请先选择收货地址！')
      return;
    }
    if (this.data.phone.length != 11 || !/^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/.test(this.data.phone)) {
      app.showModal('手机号格式有误!')
      return;
    }
    if (this.data.detail.length == 0) {
      app.showModal('详细地址不能为空！')
      return;
    }
    var that = this,
      openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      val = this.data.value
    if (this.data.page_status=='new'){
      wx.request({
        method: 'POST',
        url: app.globalData.link_origin + 'member_api/save_user_address',
        data: {
          token: app.DP({
            id: 0,
            openid: openid,
            session_id: session_id,
            province_name: Area.area[val[0]].area_name,
            city_name: Area.area[val[0]].children[val[1]].area_name,
            district_name: Area.area[val[0]].children[val[1]].children[val[2]].area_name,
            detaile_address: that.data.detail,
            contacts: that.data.name,
            mobile_code: that.data.phone,
            is_default: 2,
            province_code: Area.area[val[0]].area_code,
            city_code: Area.area[val[0]].children[val[1]].area_code,
            district_code: Area.area[val[0]].children[val[1]].children[val[2]].area_code
          }),
          id: 0,
          openid: openid,
          session_id: session_id,
          province_name: Area.area[val[0]].area_name,
          city_name: Area.area[val[0]].children[val[1]].area_name,
          district_name: Area.area[val[0]].children[val[1]].children[val[2]].area_name,
          detaile_address: that.data.detail,
          contacts: that.data.name,
          mobile_code: that.data.phone,
          is_default: 2,
          province_code: Area.area[val[0]].area_code,
          city_code: Area.area[val[0]].children[val[1]].area_code,
          district_code: Area.area[val[0]].children[val[1]].children[val[2]].area_code
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: function (res) {
          if (res.data.status == 1000) {
            wx.showToast({
              title: '新增成功！',
              icon: 'success',
              duration: 500
            })
            //新增成功处理
            that.get_address(false,function(){
              console.log(that.data.list.length)
              if(that.data.list.length==1){
                var pages=getCurrentPages()
                if (pages[pages.length - 2].route == 'pages/productDetail/productDetail' || pages[pages.length - 2].route == 'pages/cart/cart'){
                  wx.redirectTo({
                    url: '../submitOrder/submitOrder',
                  })
                } else if (pages[pages.length - 2].route == 'pages/submitOrder/submitOrder'){
                  pages[pages.length - 2].refresh()
                  wx.navigateBack({
                    delta: 1
                  })
                }
              } else if (that.data.list.length > 1){
                setTimeout(function () {
                  that.setData({
                    page_status: 'list'
                  })
                  wx.setNavigationBarTitle({
                    title: '收货地址列表'
                  })
                }, 500)
              }else{
                that.loading.hideLoading()
                app.showModal('请求地址列表失败！')
              }
            })
            
          } else if (!again && res.data.status == 4004) {
            app.resetSession(that.sucTap, true)
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
    } else if (this.data.page_status=='edit'){
      wx.request({
        method: 'POST',
        url: app.globalData.link_origin + 'member_api/save_user_address',
        data: {
          token: app.DP({
            id: that.data.id,
            openid: openid,
            session_id: session_id,
            province_name: Area.area[val[0]].area_name,
            city_name: Area.area[val[0]].children[val[1]].area_name,
            district_name: Area.area[val[0]].children[val[1]].children[val[2]].area_name,
            detaile_address: that.data.detail,
            contacts: that.data.name,
            mobile_code: that.data.phone,
            is_default: that.data.is_default,
            province_code: Area.area[val[0]].area_code,
            city_code: Area.area[val[0]].children[val[1]].area_code,
            district_code: Area.area[val[0]].children[val[1]].children[val[2]].area_code
          }),
          id: that.data.id,
          openid: openid,
          session_id: session_id,
          province_name: Area.area[val[0]].area_name,
          city_name: Area.area[val[0]].children[val[1]].area_name,
          district_name: Area.area[val[0]].children[val[1]].children[val[2]].area_name,
          detaile_address: that.data.detail,
          contacts: that.data.name,
          mobile_code: that.data.phone,
          is_default: that.data.is_default,
          province_code: Area.area[val[0]].area_code,
          city_code: Area.area[val[0]].children[val[1]].area_code,
          district_code: Area.area[val[0]].children[val[1]].children[val[2]].area_code
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: function (res) {
          if (res.data.status == 1000) {
            wx.showToast({
              title: '更新成功！',
              icon: 'success',
              duration: 500
            })
            var pages = getCurrentPages()
            pages[pages.length - 2].refresh()
            //更新成功处理
            that.get_address(false)
            setTimeout(function () {
              that.setData({
                page_status: 'list'
              })
              wx.setNavigationBarTitle({
                title: '收货地址列表'
              })
            }, 500)
          } else if (!again && res.data.status == 4004) {
            app.resetSession(that.sucTap, true)
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
  }
})