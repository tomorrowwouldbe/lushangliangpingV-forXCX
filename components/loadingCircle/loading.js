Component({
  options:{
    multipleSlots:true
  },
  properties:{
    
  },
  data:{
    isShow:false
  },
  methods:{
    hideLoading(){
      const that=this
      setTimeout(function(){
        that.setData({
          isShow: false
        })
      },100)
    },
    showLoading(){
      this.setData({
        isShow: true
      })
    }
  }
})