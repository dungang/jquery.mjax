/**
 * Created by dungang on 2017/2/22.
 */
+function ($) {
    //Select2 doesn't work when embedded in a bootstrap modal
    //搜索框不能输入和聚焦
    //http://stackoverflow.com/questions/18487056/select2-doesnt-work-when-embedded-in-a-bootstrap-modal
    if ($.fn.modal) $.fn.modal.Constructor.prototype.enforceFocus = function () {};

    var version = '1.0.1';

    var headers = {
        'X-Mjax-Request':version
    };

    function MjaxModel(element,opts) {
        this.element = element;
        this.pageChanged = false;
        this.opts = opts;
        this.modal = $('<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mjax"></div>');
        this.modalDoc = $('<div class="modal-dialog" role="document"></div>');
        this.modalContent = $('<div class="modal-content"></div>');
        this.modalHeader = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
        this.modalHeaderTitle = $('<h4 class="modal-title">Modal title</h4>');
        this.modalBody = $('<div class="modal-body"></div>');
        this.modalFooter = $('<div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>');


        this.modal.append(this.modalDoc);
        this.modalDoc.append(this.modalContent);
        this.modalContent.append(this.modalHeader).append(this.modalBody);
        //modalContent.append(modalFooter);
        this.modalHeader.append(this.modalHeaderTitle);
        this.modalBody.css({
            padding:'1px 0'
        });
        var _this = this;
        this.modal.on('hidden.bs.modal', function () {
            //如果关闭模态框，则刷新当前页面
            if (_this.pageChanged && _this.opts.refresh) {
                opts.close.call(_this);
            }
            _this.destroy();
        });

    }

    MjaxModel.prototype.updateBody = function()
    {
        this.modalBody.find('.mjax').mjax(this.opts);
        var _this = this;
        this.modalBody.find('form').each(function () {
            var _form = $(this);
            _form.off('submit');
            _form.on('submit', function (event) {
                event.result = false;
                $(this).ajaxSubmit({
                    headers:headers,
                    beforeSubmit:function(){
                        _this.opts.beforeSubmit.call(_this);
                    },
                    complete:function (xhr) {
                        _this.processRedirect(xhr,true,false);
                        _this.opts.submitComplete.call(_this);
                    },
                    success: function (response) {
                        //将表单的结果页面覆盖模态框Body
                        _this.extractContent(response);
                        _this.pageChanged = true;
                        _this.opts.submitSuccess.call(_this);
                    }
                });
                return false;
            });
        });
    };

    MjaxModel.prototype.processRedirect = function (xhr,pageChange,show) {
        var _this = this;
        //X-Mjax-Redirect 309
        if(xhr.status == 309) {
            var redirect = xhr.getResponseHeader('X-Mjax-Redirect');
            _this.mjaxGet(redirect,function (response) {
                //将表单的结果页面覆盖模态框Body
                _this.extractContent(response);
                _this.pageChanged = pageChange;
                if (show) {
                    _this.show();
                }
            })
        }
    };

    MjaxModel.prototype.show = function () {
        var modalSize = this.element.data('mjax-size');
        this.modalDoc.removeClass('modal-lg').removeClass('modal-sm');
        if ( modalSize== 'sm') {
            this.modalDoc.addClass('modal-sm');
        } else if (modalSize == 'lg') {
            this.modalDoc.addClass('modal-lg');
        }
        this.modal.modal({
            backdrop: false  //静态模态框，即单鼠标点击模态框的外围时，模态框不关闭。
        });
    };

    MjaxModel.prototype.destroy = function()
    {
        this.opts = null;
        this.modal.remove();
        this.modalDoc.remove();
        this.modalContent.remove();
        this.modalHeader.remove();
        this.modalHeaderTitle.remove();
        this.modalBody.remove();
        this.modalFooter.remove();
    };

    MjaxModel.prototype.mjaxGet = function(url,callback)
    {
        var _this = this;
        return $.ajax({
            url:url,
            type:'get',
            complete:function (xhr) {
                _this.processRedirect(xhr,false,true);
            },
            success:callback,
            headers:headers
        });
    };

    MjaxModel.prototype.extractContent = function(response) {
        var content = $($.parseHTML(response,document,true));
        var scripts = this.findAll(content,'script').remove();
        var links = this.findAll(content,'link').remove();
        content = content.not(scripts).not(links);
        this.modalBody.empty().html(content);
        var _this = this;
        $.when(
            _this.executeTags(links,'link','href',true),
            _this.executeTags(scripts,'script','src',true)
        ).done(function () {
            _this.updateBody();
        });

    };

    MjaxModel.prototype.findAll = function (elems, selector) {
        return elems.filter(selector).add(elems.find(selector));
    };

    MjaxModel.prototype.executeTags = function (tags,tag, attr,reload) {
        if (!tags) return false;
        var dtd = $.Deferred();
        var existingTags= $(tag + '['+attr+']');
        var _this = this;
        var cb = function (next) {
            var attribute = this[attr];
            var matchedTags = existingTags.filter(function () {
                return this[attr] === attribute
            });
            if (matchedTags.length) {
                next();
                return;
            }
            if (attribute) {
                if(reload) $.getScript(attribute).done(next).fail(next);
                document.head.appendChild(this);
            } else {
                _this.modalBody.append(this);
                next()
            }
        };
        var i = 0;
        var next = function () {
            if (i >= tags.length) {
                dtd.resolve();
                return
            }
            var tag = tags[i];
            i++;
            cb.call(tag, next)
        };
        next();
        return dtd;
    };

    $.fn.mjax = function (options) {
        var opts = $.extend({}, $.fn.mjax.DEFAULTS, options);
        return this.each(function () {
            var _this = $(this);
            //关闭模态框的时候是否刷新当前页面
            var _refresh = _this.data('mjax-refresh');
            if (_refresh != undefined) {
                opts.refresh = _refresh;
            }
            if (_this.data('mjax-bind')) {
                return;
            } else {
                _this.data('mjax-bind',true);
            }

            _this.click(function (e) {
                var arch = $(this);
                var instance = new MjaxModel(arch,opts);
                e.preventDefault();
                if(_this.attr('title')) {
                    instance.modalHeaderTitle.html(_this.attr('title'));
                } else {
                    instance.modalHeaderTitle.html(_this.html());
                }
                instance.mjaxGet(_this.attr('href'), function (response) {
                    instance.extractContent(response);
                    instance.show();
                });
            });
        });
    };



    $.fn.mjax.DEFAULTS = {
        refresh: false,//关闭模态框的时候是否刷新当前页面
        beforeSubmit:$.noop,
        submitComplete:$.noop,
        submitSuccess:$.noop,
        close:function(){
            window.location.reload();
        }
    };

    $(document).ready(function () {
        $('.mjax').mjax();
    });
}(jQuery);