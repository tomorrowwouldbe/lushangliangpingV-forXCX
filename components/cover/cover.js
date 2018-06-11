var app=getApp()

Component({
  options: {
    multipleSlots: true
  },
  properties: {

  },
  data: {
    isShow: false
  },
  methods: {
    closeCover() {
      this.setData({
        isShow: false
      })
    },
    openCover() {
      this.setData({
        isShow: true
      })
    },
    onGotUserInfo(e){
      console.log(e.detail)
      app.resetSession();
    }
  }
})