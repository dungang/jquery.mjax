/**
 * Created by dungang on 2017/2/22.
 */
+function ($) {

    if (!$.fn.mjaxInstance) {
        var modal = $('<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="mjax"></div>');
        var modalDoc = $('<div class="modal-dialog" role="document"></div>');
        var modalContent = $('<div class="modal-content"></div>');
        var modalHeader = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
        var modalHeaderTitle = $('<h4 class="modal-title" id="myModalLabel">Modal title</h4>');
        var modalBody = $('<div class="modal-body"></div>');
        var modalFooter = $('<div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>');

        modal.append(modalDoc);
        modalDoc.append(modalContent);
        modalContent.append(modalHeader).append(modalBody);
        //modalContent.append(modalFooter);
        modalHeader.append(modalHeaderTitle);
        $('body').append(modal);

        $.fn.mjaxInstance = {
            modal: modal,
            modalDoc: modalDoc,
            modalContent: modalContent,
            modalHeader: modalHeader,
            modalHeaderTitle: modalHeaderTitle,
            modalBody: modalBody,
            modalFooter: modalFooter
        };


    }
    //页面是否发送变化
    var _changed = false;

    $.fn.mjax = function (options) {
        var opts = $.extend({}, $.fn.mjax.DEFAULTS, options);
        var instance = $.fn.mjaxInstance;

        //Select2 doesn't work when embedded in a bootstrap modal
        //搜索框不能输入和聚焦
        //http://stackoverflow.com/questions/18487056/select2-doesnt-work-when-embedded-in-a-bootstrap-modal
        if ($.fn.modal) $.fn.modal.Constructor.prototype.enforceFocus = function () {
        };
        return this.each(function () {
            var _this = $(this);
            if (_this.data('mjax-bind')) {
                return;
            } else {
                _this.data('mjax-bind',true);
            }
            //关闭模态框的时候是否刷新当前页面
            var _refresh = _this.data('mjax-refresh');
            if (_refresh) {
                opts.refresh = _refresh;
            }
            _changed = false;
            _this.click(function (e) {
                var arch = $(this);
                e.preventDefault();
                instance.modalHeaderTitle.html(_this.html());
                $.get(_this.attr('href'), function (response) {
                    instance.modal.on('hidden.bs.modal', function () {
                        //如果关闭模态框，则刷新当前页面
                        if (_changed && opts.refresh) window.location.reload();
                    });
                    extractContent(opts,response,instance.modalBody);
                    var modalSize = arch.data('mjax-size');
                    instance.modalDoc.removeClass('modal-lg').removeClass('modal-sm');
                    if ( modalSize== 'sm') {
                        instance.modalDoc.addClass('modal-sm');
                    } else if (modalSize == 'lg') {
                        instance.modalDoc.addClass('modal-lg');
                    }
                    instance.modal.modal({
                        backdrop: false  //静态模态框，即单鼠标点击模态框的外围时，模态框不关闭。
                    });
                });
            });
        });
    };

    function updateModalBody(opts) {
        //如果有表单，则绑定ajax提交表单yiiActiveForm
        modalBody.find('form').each(function () {
            var _form = $(this);
            var eventName = 'submit';
            if (_form.data(opts.detectData)) {
                eventName = opts.detectEvent;
            }
            _form.on(eventName, function (event) {
                //通知yii.activeForm 不要提交表单，由本对象通过ajax的方式提交表单
                event.result = false;
                $(this).ajaxSubmit({
                    complete:function (xhr) {
                        //X-Mjax-Redirect 309
                        if(xhr.status == 309) {
                            var redirect = xhr.getResponseHeader('X-Mjax-Redirect');
                            $.get(redirect,function (response) {
                                //将表单的结果页面覆盖模态框Body
                                extractContent(opts,response,modalBody);
                                _changed = true;
                            })
                        }

                    },
                    success: function (response) {
                        //将表单的结果页面覆盖模态框Body
                        extractContent(opts,response,modalBody);
                        _changed = true;
                    }
                });
                return false;
            });
        });
    };

    function extractContent(opts,response,context) {
        var content = $($.parseHTML(response,document,true));
        var scripts = findAll(content,'script').remove();
        var links = findAll(content,'link').remove();
        context.empty().html(content.not(scripts).not(links));
        $.when(
            executeTags(links,context,'link','href',true),
            executeTags(scripts,context,'script','src',true)
        ).done(function () {
            updateModalBody(opts);
        });

    }

    function findAll(elems, selector) {
        return elems.filter(selector).add(elems.find(selector));
    }

    function executeTags(tags,context,tag, attr,reload) {
        if (!tags) return false;
        var dtd = $.Deferred();
        var existingTags= $(tag + '['+attr+']');
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
                context.append(this);
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
    }

    $.fn.mjax.DEFAULTS = {
        refresh: false //关闭模态框的时候是否刷新当前页面
        //detectData:'yiiActiveForm', //如果submit已经绑定了其他的事件，如果判断已经存在的依据
        //detectEvent: 'beforeSubmit', //如果submit已经绑定事件，切入点事件
    };

    $(document).ready(function () {
        $('.mjax').mjax();
    });
}(jQuery);