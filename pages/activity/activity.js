var windowHeight, app = getApp()
wx.getSystemInfo({
  success: function (res) {
    windowHeight = res.windowHeight
  }
})
Page({
  data:{
    windowHeight: windowHeight,
    image_origin: app.globalData.image_origin,
    bgLoaded:false,
    logoLoaded:false,
    imgCount:0
  },
  onLoad(){
    this.loading = this.selectComponent('#loadingC')
    this.loading.showLoading()
  },
  bgLoad(){
    this.setData({
      bgLoaded:true
    })
    this.check()
  },
  logoLoad(){
    this.setData({
      logoLoaded: true
    })
    this.check()
  },
  imgLoad(){
    var imgCount = this.data.imgCount
    imgCount++
    this.setData({
      imgCount: imgCount
    })
    this.check()
  },
  check(){
    if (this.data.imgCount>=10&&this.data.bgLoaded && this.data.logoLoaded){
      this.loading.hideLoading()
    }
  },
  jump(e){
    const id=e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../productDetail/productDetail?goods_id='+id,
    })
  }
})