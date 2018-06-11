Page({
  data:{
    order_id:'',
    order_sn:'',
    total_fee:0.00,
    route_status:false,
    winHeight:400
  },

  onLoad(options){
    var that=this
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winHeight: res.windowHeight
        })
      }
    })
    this.setData({
      order_id:options.order_id,
      order_sn:options.order_sn,
      total_fee:options.total_fee
    })
  },

  goOrderDeatil:function(){
    var that=this
    // wx.navigateTo({
    //   url: '../orderDetail/orderDetail?order_id='+that.data.order_id,
    // })
    wx.navigateTo({
      url: '../ordersList/ordersList?type=0',
    })
  },
  goIndex:function(){
    wx.switchTab({
      url: '../index/index',
    })
  }
})