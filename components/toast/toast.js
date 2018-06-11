var Ttimer
Component({
  options: {
    multipleSlots: true
  },
  properties: {

  },
  data: {
    isShow:false,
    text:'温馨提示'
  },
  methods: {
    showToast(text){
      if (Ttimer){
        clearTimeout(Ttimer)
        this.setData({
          isShow: false
        })
      }
      this.setData({
        text:String(text),
        isShow:true
      })
      Ttimer=setTimeout(()=>{
        this.setData({
          isShow:false
        })
        clearTimeout(Ttimer)
      },1800)
    }
  }
})