var app = getApp()
var winHeight, winWidth, platform, timer
wx.getSystemInfo({
  success: function (res) {
    platform = res.model.split(' ')[0]
    winHeight = res.windowHeight
    winWidth = res.windowWidth
  }
})
Page({
  data: {
    winHeight: winHeight,  //屏幕高度
    platform: platform,   //手机型号
    rScrollTop: 0, //右下方scroll-top

    indicatorDots: true,  //swiper圆点显示
    autoplay: true, //swiper自动轮播
    interval: 5000,
    duration: 500,
    circular: true,

    banner_load: false,
    cate_load: false,
    num_load: false,

    cate: [],  //左下方分类列表
    leftArr: [], //左下方渲染的分类列表
    sortArr: [], //所有分类
    rightArr: [],
    cart_total: {}, //购物车情况
    banner: [],  //banner图
    left_scrollTop: 0, //左下方分类scroll-top
    banner_show: false //是否显示banner
  },

  bannerLoad(e) {
    var banner = this.data.banner, index = e.currentTarget.dataset.index
    banner[index].banner_show = true
    this.setData({
      banner: banner
    })
  },

  productLoad(e) {
    var sortArr = this.data.sortArr, id = e.currentTarget.dataset.id
    sortArr.forEach(function (value) {
      if (value.children) {
        value.children.forEach(function (val) {
          if (val.goods_id == id) {
            val.product_show = true
          }
        })
      }
    })
    this.setData({
      sortArr: sortArr
    })
  },

  //页面加载
  onLoad: function () {
    //选取插件loadingC并显示
    this.loading = this.selectComponent("#loadingC");
    this.loading.showLoading()
    //1、获取分类
    //2、获取商品并分类
    //3、添加 推荐产品
    //4、根据sortArr获取 每个小分类的高度
    this.allRequest()
  },

  onPullDownRefresh() {
    this.setData({
      left_scrollTop: 0,
      rScrollTop: 0
    })
    app.resetSession(this.allRequest)
  },

  allRequest() {
    this.get_banner()
    this.get_category()
    this.get_cart_num()
  },

  checkResult(that) {
    if (this.data.banner_load && this.data.cate_load && this.data.num_load) {
      wx.stopPullDownRefresh()
      that.loading.hideLoading()
    }
  },

  //获取 banner
  get_banner(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      url: app.globalData.link_origin + 'goods_category_api/get_banner',
      data: {
        token: app.DP({ openid: openid, session_id: session_id, is_staff: 1 }),
        openid: openid,
        session_id: session_id,
        is_staff: 1
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          var banner = res.data.data
          banner.forEach(function (value) {
            // value.banner_show = false
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
          //that.get_category()
          //that.get_cart_num()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_banner, true)
        } else {
          that.loading.hideLoading()
          wx.stopPullDownRefresh()
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        that.loading.hideLoading()
        wx.stopPullDownRefresh()
        app.showModal('请求超时！')
      }
    })
  },

  //获取 分类
  get_category(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id')
    wx.request({
      url: app.globalData.link_origin + 'goods_category_api/get_all',
      data: {
        token: app.DP({ openid: openid, session_id: session_id, is_staff: 1 }),
        openid: openid,
        session_id: session_id,
        is_staff: 1
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          var cate = []
          cate.push({
            id: 'static',
            mobile_name: '推荐产品',
            parent_id: "0",
            isActive: true
          })
          res.data.data.forEach(function (value, index) {
            value.subShow = false
            value.isActive = false
            if (value.children && value.children.length) {
              value.children.forEach(function (val, idx) {
                val.isActive = false
              })
            }
            cate.push(value)
          })
          that.setData({
            cate: cate
          })
          var sortArr = []
          cate.forEach(function (value, index) {
            if (!value.children) {
              sortArr.push(value)
            } else {
              value.children.forEach(function (val, idx) {
                sortArr.push(val)
              })
            }
          })

          that.setData({
            sortArr: sortArr
          })
          that.get_goods()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_category, true)
        } else {
          that.loading.hideLoading()
          wx.stopPullDownRefresh()
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        that.loading.hideLoading()
        wx.stopPullDownRefresh()
        app.showModal('请求超时！')
      }
    })
  },

  //获取 全部商品
  get_goods(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    wx.request({
      url: app.globalData.link_origin + 'goods_api/get_list',
      data: {
        token: app.DP({
          openid: openid,
          cat_id: '',
          session_id: session_id,
          is_staff: 1,
          is_member: is_member
        }),
        openid: openid,
        cat_id: '',
        session_id: session_id,
        is_staff: 1,
        is_member: is_member
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          var cate = that.data.cate, sortArr = that.data.sortArr
          sortArr.forEach(function (value, index) {
            res.data.data.forEach(function (val, idx) {
              if (value.id == val.cat_id) {
                if (!sortArr[index].children) {
                  sortArr[index].children = []
                  sortArr[index].children.push(val)
                } else {
                  sortArr[index].children.push(val)
                }
              }
            })
          })
          that.setData({
            sortArr: sortArr
          })
          that.get_commands()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_goods, true)
        } else {
          that.loading.hideLoading()
          wx.stopPullDownRefresh()
          app.showModal(res.data.msg)
        }
      },
      fail(res) {
        that.loading.hideLoading()
        wx.stopPullDownRefresh()
        app.showModal('请求超时！')
      }
    })
  },

  //请求 推荐产品
  get_commands(again) {
    var that = this
    var openid = wx.getStorageSync('lushang_userInfo').openid,
      session_id = wx.getStorageSync('session_id'),
      is_staff = wx.getStorageSync('lushang_userInfo').is_staff,
      is_member = wx.getStorageSync('lushang_userInfo').is_member
    wx.request({
      url: app.globalData.link_origin + 'goods_api/get_recommend',
      data: {
        token: app.DP({
          openid: openid,
          session_id: session_id,
          is_staff: 1,
          is_member: is_member
        }),
        openid: openid,
        session_id: session_id,
        is_staff: 1,
        is_member: is_member
      },
      header: {
        "Content-Type"
        : "application/x-www-form-urlencoded"
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status == 1000) {
          var sortArr = that.data.sortArr
          if (!sortArr[0].children)
            sortArr[0].children = []
          sortArr[0].children = res.data.data
          that.setData({
            sortArr: sortArr
          })

          var cate = that.data.cate, sortArr = that.data.sortArr
          for (var i = cate.length - 1; i > 0; i--) {
            if (cate[i].id != 'static') {
              if (!cate[i].children) {
                cate.splice(i, 1)
              } else {
                for (var j = cate[i].children.length - 1; j > 0; j--) {
                  if (!cate[i].children[j].children) {
                    cate[i].children.splice(j, 1)
                  }
                }
              }
            }
          }
          for (var j = sortArr.length - 1; j > 0; j--) {
            if (!sortArr[j].children) {
              sortArr.splice(j, 1)
            }
          }

          //删除没有产品的分类
          var has = false
          for (var i = cate.length - 1; i >= 0; i--) {
            has = false
            if (cate[i].id != 'static') {
              for (var j = cate[i].children.length - 1; j >= 0; j--) {
                if (!cate[i].children[j].children) {
                  cate[i].children.splice(j, 1)
                } else {
                  for (var k = 1; k < sortArr.length; k++) {
                    if (cate[i].children[j].id == sortArr[k].id) {
                      has = true
                    }
                  }
                }
              }
              if (!has) {
                cate.splice(i, 1)
              }
            } else {
              if (cate[i].children.length == 0) {
                cate.splice(i, 1)
                sortArr.shift()
                cate[0].subShow = true
                cate[0].isActive = true
                cate[0].children[0].isActive = true
              }
            }
          }

          if (sortArr[0].id == 'static') {
            sortArr.forEach(function (value, idx) {
              if (value.id == 'static') {
                value.parent_index = 0
                value.self_index = -1
              } else {
                if (value.parent_id == sortArr[idx - 1].parent_id) {
                  value.parent_index = sortArr[idx - 1].parent_index
                  value.self_index = sortArr[idx - 1].self_index + 1
                } else {
                  value.parent_index = sortArr[idx - 1].parent_index + 1
                  value.self_index = 0
                }
              }
              value.children.forEach(function (val) {
                val.product_show = false
              })
            })
          } else {
            sortArr.forEach(function (value, idx) {
              if (idx == 0) {
                value.parent_index = 0
                value.self_index = 0
              } else {
                if (value.parent_id == sortArr[idx - 1].parent_id) {
                  value.parent_index = sortArr[idx - 1].parent_index
                  value.self_index = sortArr[idx - 1].self_index + 1
                } else {
                  value.parent_index = sortArr[idx - 1].parent_index + 1
                  value.self_index = 0
                }
              }
              value.children.forEach(function (val) {
                val.product_show = false
              })
            })
          }

          that.setData({
            cate: cate,
            leftArr: cate,
            sortArr: sortArr,
            rightArr: sortArr,
            cate_load: true
          })
          // that.get_height()
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_commands, true)
        } else {
          that.loading.hideLoading()
          wx.stopPullDownRefresh()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.loading.hideLoading()
        wx.stopPullDownRefresh()
        app.showModal('请求超时！')
      }
    })
  },

  productLoaded() {
    this.get_height()
  },


  //获取 分类商品高度
  get_height() {
    var calc_h = 0, that = this
    var query = wx.createSelectorQuery();
    //选择id
    query.select('#mjltest').boundingClientRect()
    query.exec(function (res) {
      //res就是 所有标签为mjltest的元素的信息 的数组
      //取高度
      calc_h = res[0].height
      var sortArr = that.data.sortArr, scrollTopArr = [], line = 0, totalH = 0
      sortArr.forEach(function (value, index) {
        if (index == 0) {
          scrollTopArr.push({
            val: 0,
            parent_index: value.parent_index,
            self_index: value.self_index
          })
        } else {
          if (sortArr[index - 1].children) {
            line = (sortArr[index - 1].children.length % 2 == 0 ? (sortArr[index - 1].children.length / 2) : (parseInt(sortArr[index - 1].children.length / 2) + 1))
            var h = line == 0 ? 0 : 50 + (Number(calc_h) + 10) * line
            totalH += h
            scrollTopArr.push({
              val: totalH,
              parent_index: value.parent_index,
              self_index: value.self_index
            })
          }
        }
      })
      that.setData({
        scrollTopArr: scrollTopArr
      })
      that.checkResult(that)
    })
  },


  //点击 一级菜单
  firstLevelTap(e) {
    var id = e.currentTarget.dataset.id,
      name = e.currentTarget.dataset.name,
      index = e.currentTarget.dataset.index,
      cate = this.data.cate,
      sortArr = this.data.sortArr,
      selfIndex = -1,
      that = this
    cate.forEach(function (value, index) {
      if (value.id == id) {
        value.subShow = !value.subShow
        if (!value.children) {
          cate.forEach(function (val, idx) {
            val.isActive = false
          })
          value.isActive = true
        }
      } else {
        value.subShow = false
      }
    })
    this.setData({
      cate: cate,
      leftArr: cate
    })
    for (var i = 0; i < sortArr.length; i++) {
      if (sortArr[i].id == id) {
        selfIndex = i
        break;
      }
    }
    if (selfIndex > -1) {
      this.setData({
        rScrollTop: this.data.scrollTopArr[selfIndex].val
      })
    }


  },

  //点击 二级菜单
  secondLevelTap(e) {
    var id = e.currentTarget.dataset.id, name = e.currentTarget.dataset.name,
      parentIndex = e.currentTarget.dataset.parentidx,
      idx = e.currentTarget.dataset.index,
      cate = this.data.cate,
      sortArr = this.data.sortArr,
      iidx = 1,
      selfIndex = 0
    cate.forEach(function (value, index) {
      value.isActive = false
      if (value.children && value.children.length) {
        value.children.forEach(function (val, idx) {
          val.isActive = false
        })
      }
    })
    cate[parentIndex].isActive = true
    cate[parentIndex].children[idx].isActive = true

    for (var i = 0; i < sortArr.length; i++) {
      selfIndex = i
      if (sortArr[i].id == id) {
        break;
      }
    }

    this.setData({
      cate: cate,
      leftArr: cate,
      rScrollTop: this.data.scrollTopArr[selfIndex].val
    })
  },

  //右侧滚动
  rightScroll(e) {
    var scrollTop = e.detail.scrollTop, idx = 0
    var scrollTopArr = this.data.scrollTopArr,
      cate = this.data.cate,
      sortArr = this.data.sortArr,
      parentIndex = 0, childIndex = -1
    for (var i = 0; i < scrollTopArr.length; i++) {
      if (scrollTop < scrollTopArr[i].val && scrollTop >= scrollTopArr[i - 1].val) {
        idx = i - 1
        break;
      } else if (scrollTop >= scrollTopArr[scrollTopArr.length - 1].val) {
        idx = scrollTopArr.length - 1
      }
    }
    if (idx != this.data.idx) {
      this.setData({
        idx: idx
      })
      parentIndex = sortArr[idx].parent_index
      childIndex = sortArr[idx].self_index
      cate.forEach(function (value, index) {
        value.isActive = false
        if (value.children) {
          value.children.forEach(function (val, idx) {
            val.isActive = false
          })
        }
        if (value.subShow == true) {
          value.subShow = false
        }
      })

      if (childIndex == -1) {
        cate[parentIndex].isActive = true
        this.setData({
          cate: cate,
          leftArr: cate
        })
      } else {
        cate[parentIndex].isActive = true
        cate[parentIndex].subShow = true
        cate[parentIndex].children[childIndex].isActive = true

        this.setData({
          cate: cate,
          leftArr: cate,
          left_scrollTop: 44 * childIndex + 55 * (parentIndex - 4)
        })
      }
    }

  },

  //获取 购物车数量
  get_cart_num(again) {
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
        if (res.data.status == 1000) {
          that.setData({
            cart_total: res.data.data,
            num_load: true
          })

          that.checkResult(that)
        } else if (!again && res.data.status == 4004) {
          app.resetSession(that.get_cart_num, true)
        } else {
          that.loading.hideLoading()
          wx.stopPullDownRefresh()
          app.showModal(res.data.msg)
        }
      },
      fail() {
        that.loading.hideLoading()
        wx.stopPullDownRefresh()
        app.showModal('请求超时！')
      }
    })
  },



  //跳转 购物车
  goCartTap: function () {
    wx.switchTab({
      url: '../cart/cart'
    })
  },

  //跳转 我的
  goMineTap: function () {
    wx.switchTab({
      url: '../mine/mine'
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

  onUnload() {
    this.loading.hideLoading()
  }
})