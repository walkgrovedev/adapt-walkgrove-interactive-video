define([
  'core/js/adapt',
  'core/js/views/componentView',
  'core/js/models/componentModel',
  'core/js/models/buildModel'
], function(Adapt, ComponentView, ComponentModel) {

  var InteractiveVideoView = ComponentView.extend({

    events: {
      'click .js-next-stage': 'showNextStage',
      'click .js-prev-stage': 'showPrevStage'
    },
    
    preRender: function() {
      this.checkIfResetOnRevisit();
    },

    postRender: function() {
      this.setReadyStatus();

      this.setUpStages();
      this.showNextStage();
    },

    _stageIndex: -1,
   // _videoCount: 0,
    
    checkIfResetOnRevisit: function() {
      var isResetOnRevisit = this.model.get('_isResetOnRevisit');

      // If reset is enabled set defaults
      if (isResetOnRevisit) {
        this.model.reset(isResetOnRevisit);
      }
    },

    setUpStages: function() {

      var MediaView = Adapt.getViewClass('media');
      var DragdropView = Adapt.getViewClass('dragdrop');

      this.model.get('_items').forEach((item, index) => {

       var model = new Backbone.Model(item);
       var newComponent;

        switch(item._component) {
          case "media":
            newComponent = new MediaView({ model: model });
            
            this.model.listenTo(model,  'change', ()=> {
              if(model.get('_isMediaEnded') === true) {
                this.showNextStage();
              }
            });

            var $container = $(".interactive-video__widget").eq(index);
            $container.append(newComponent.$el);  
            break;

          case "mcq":
            
            break;

          case "dragdrop":
            newComponent = new DragdropView({ model: model });

            this.model.listenTo(model,  'change', ()=> {
              console.log(model);
              if(model.get('_isComplete') === true) {
                console.log("dragdrop completed");
              }
            });

            var $container = $(".interactive-video__widget").eq(index);
            $container.append(newComponent.$el);
            break;
        }
        
        
        
        
      });
    },

    showNextStage: function() {
      if(this._stageIndex < this.model.get('_items').length - 1) {
        this._stageIndex++;
        this.model.get('_items').forEach((item, index) => {
          if(this._stageIndex === index) {
            $("." + item._id).removeClass('u-visibility-hidden');
            $("." + item._id).removeClass('hide');

            //if(item._component === "media") {
              //var video = this.$('video')[this._videoCount];
              //video.addEventListener("ended", ()=> {
                //alert("next");
                //this.showNextStage();
              //});
              //this._videoCount++;
            //}
          } else {
            $("." + item._id).addClass('u-visibility-hidden');
            $("." + item._id).addClass('hide');
          }
        });
        this.updateProgress();
      }
    },

    showPrevStage: function() {
      if(this._stageIndex > 0) {
        this._stageIndex--;
        this.model.get('_items').forEach((item, index) => {
          if(this._stageIndex === index) {
            $("." + item._id).removeClass('u-visibility-hidden');
            $("." + item._id).removeClass('hide');
          } else {
            $("." + item._id).addClass('u-visibility-hidden');
            $("." + item._id).addClass('hide');
          }
        });
        this.updateProgress();
      }
    },

    updateProgress: function() {

      this.model.get('_items').forEach((item, index) => {
        if(index < this._stageIndex) {
          this.$('.interactive-video__progress-dot').eq(index).addClass('is-complete');
          this.$('.interactive-video__progress-dot').eq(index).removeClass('is-active');
        } else if(index === this._stageIndex) {
          this.$('.interactive-video__progress-dot').eq(index).addClass('is-active');
        } else {
          this.$('.interactive-video__progress-dot').eq(index).removeClass('is-complete');
          this.$('.interactive-video__progress-dot').eq(index).removeClass('is-active');
        }
      });

      if(this._stageIndex < 1) {
        this.$('.js-prev-stage').attr('disabled', true);
      } else {
        this.$('.js-prev-stage').attr('disabled', false);
      }

      if(this._stageIndex === this.model.get('_items').length - 1) {
        this.$('.js-next-stage').attr('disabled', true);
      } else {
        this.$('.js-next-stage').attr('disabled', false);
      }

    }



  },
  {
    template: 'interactive-video'
  });

  return Adapt.register('interactive-video', {
    model: ComponentModel.extend({}),// create a new class in the inheritance chain so it can be extended per component type if necessary later
    view: InteractiveVideoView
  });
});
