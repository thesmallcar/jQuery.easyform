/*
 * 表单验证插件 easyform
 * Author : 李兰非
 * 2014-11-5
 * 用于表单验证
 * 只要在需要验证的控件上添加easyform属性即可，多个属性用[;]连接，语法类似css
 * 属性列表：
 *      null
 *      email
 *      char-normal         英文、数字、下划线
 *      char-chinese        中文、英文、数字、下划线、中文标点符号
 *      char-english        英文、数字、下划线、英文标点符号
 *      length:1 10 / length:4      能够识别汉字等宽字符长度
 *      equal:xxx                               等于某个对象的值，冒号后是jq选择器语法
 *      ajax:fun()
 *      real-time                               实时检查
 *      date                    2014-10-31
 *      time                    10:30:00
 *      datetime            2014-10-31 10:30:00
 *      money               正数，两位小数
 *      uint :1 100                 正整数 , 参数为起始值和最大值
 *      number              不限长度的数字字符串
 *      float:7 2
 *
 *
 *  ------ requirement list ----------------------------------------------------
 * 1. 2014-11-18 没有排除隐藏起来的input和hidden类型的input
 * 2. 2014-11-18 需要支持有条件的提示信息。
 * 3. 2014-11-19 ajax不支持异步
 * 4. 2014-11-19 没有考虑file类型等特殊类型的判断
 * 5. 2014-11-20 当网页载入时有隐藏的控件，之后控件显示出来后，其关联的easytip不能正确显示位置
 * 6. 2014-11-21 目前不支持属性继承
 * 7. 2014-11-21 实时检查的时候，弹出的easytip有时候会导致弹出信息的消息出错
 * 8. 2015-4-10 input没有easyform属性时，不提交表单
 * 9. 需要添加一些事件，包括 提交、验证
 *
 *
 * ------ change list -------------------------------------------------
 * 1. 2014-11-18 requirement list 1 完成
 * 2. 2014-11-18 支持实时检查
 * 3. 2014-11-18 requirement list 2 完成
 * 4. 2014-11-20 requirement list 3支持了ajax异步验证方式。
 * 5. 2014-11-21 requirement list 5完成
 * 6. 2015-4-12 requirement list 8完成
 * 7. 2015-5-11 正确识别汉字长度
 *
 * ------ DEMO  -------------------------------------------------
 * <input type="text" id="demo"  easyform="length:4 16;number;" message-number="必须是数字" message-length="长度错误">
 * */
;

/**
 * 读取一个控件的指定data属性，并通过：和；来分割成key/value值对
 * @id string 控件id
 * @name string 属性名称
 **/
function easy_load_options(id, name)
{
    var options = $("#" + id).data(name);

    //将字符串用；分割
    options = (!!options ? options.split(";") : undefined);

    if (!!options)
    {
        var data = Object();
        var index;
        for (index in options)
        {
            var temps = options[index];
            var p = temps.indexOf(":");

            var temp = [];
            if (-1 == p)
            {
                temp[0] = temps;
                temp[1] = "";
            }
            else
            {
                temp[0] = temps.substring(0, p);
                temp[1] = temps.substring(p + 1);
            }

            if (temp[0].length > 0)
                data[temp[0]] = temp[1];
        }
    }

    return data;
}

function get_js_path(jsFileName)
{
    var e = {};
    var htmlPath = "";
    var jsPath = "";
    if (document.location.protocol == 'file:')
    {
        e.BasePath = unescape(document.location.pathname.substr(1));
        e.BasePath = e.BasePath.replace(/\\/gi, '/');
        e.BasePath = 'file://' + e.BasePath.substring(0, e.BasePath.lastIndexOf('/') + 1);
        e.FullBasePath = e.BasePath;
    }
    else
    {
        e.BasePath = document.location.pathname.substring(0, document.location.pathname.lastIndexOf('/') + 1);
        e.FullBasePath = document.location.protocol + '//' + document.location.host + e.BasePath;
    }

    htmlPath = e.FullBasePath;
    var scriptTag = document.getElementsByTagName("script");
    for (var i = 0; i < scriptTag.length; i++)
    {
        if (scriptTag[i].src.lastIndexOf(jsFileName) >= 0)
        {
            var src = scriptTag[i].src.replace(/\\/gi, '/');//把\转换为/
            if (src.toLowerCase().indexOf("file://") == 0)
            {//http全路径形式 file://
                var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                jsPath = _temp;
                //alert("file://")
            }
            else if (src.toLowerCase().indexOf("http://") == 0)
            {//http全路径形式 http://
                var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                jsPath = _temp;
                //alert("http://")
            }
            else if (src.toLowerCase().indexOf("https://") == 0)
            {//http全路径形式 https://
                var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                jsPath = _temp;
                //alert("https://")
            }
            else if (src.toLowerCase().indexOf("../") == 0)
            {//相对路径形式 ../
                jsPath = htmlPath + src.substring(0, src.lastIndexOf('/') + 1);
                //alert("../")
            }
            else if (src.toLowerCase().indexOf("./") == 0)
            {//相对路径形式 ./
                jsPath = htmlPath + src.substring(0, src.lastIndexOf('/') + 1);
                //alert("./")
            } else if (src.toLowerCase().indexOf("/") == 0)
            {//相对路径形式 /,只有采用http访问时有效
                if (document.location.protocol == 'http:' || document.location.protocol == 'https:')
                {
                    var _temp = document.location.protocol + "//" + document.location.host + src.substring(0, src.lastIndexOf('/') + 1);
                    jsPath = _temp;
                }
                //alert("/")
            }
            else if (src.toLowerCase().search(/^([a-z]{1}):/) >= 0)
            {//盘符形式 c:
                var _temp = src.substring(0, src.lastIndexOf('/') + 1);
                jsPath = _temp;
                //alert("^([a-z]+):")
            }
            else
            {//同级形式
                jsPath = htmlPath;
            }
        }
    }

    return jsPath;
}

//easyimagefile 图片文件上传
//TODO 替换内容的方式有问题，应该换成更好的html
//TODO 不能缓存提交一个默认值，在修改内容的时候，不能保持过去的值
//TODO 默认空白图片不对，可以考虑不使用img控件
(function ($, window, document, undefined)
{
    var _easyimagefile = function (input, opt)
    {
        this.input = input;
        this.id = input.attr('id');

        this.fileid = this.id + "-file";
        this.imgid = this.id + "-img";
        this.tipid = this.id + "-tip";
        this.delid = this.id + "-del";

        this.last_file = null;

        this.defaults = {
            "default": get_js_path("easyform.js") + "none.png"
        };

        this.options = $.extend({}, this.defaults, opt);
    };

    _easyimagefile.prototype = {

        init: function ()
        {
            var style = this.input.attr('style');
            var $this = this;
            var src = this.input.attr('src');

            if (!src || src.length == 0)
            {
                src = $this.options.default;
            }


            var sclass = this.input.attr('class');

            var tip_text = this.input.attr('title');

            if (!tip_text) tip_text = "";

            this.input.css("position", "relative");

            var x = this.input.position().left;
            var y = this.input.position().top;
            var w = this.input.outerWidth();
            var h = this.input.outerHeight();

            var file = "<input type='file' name='" + $this.fileid + "'  id='" + $this.fileid + "' style='display:none;'>";
            var img = "<img src='" + src + "' name='" + $this.imgid + "'  id='" + $this.imgid + "' style='" + style + ";cursor:pointer;' class='" + sclass + "'>";
            var tip = "<div id='" + $this.tipid + "' style='display:none; position:absolute;top:" + y + "px;left:" + x + "px;width:" + w + "px;height:" + h + "px;background-color:#000;text-align:center;cursor:pointer;-moz-opacity: 0.6; opacity:0.6; filter: alpha(opacity=60);color:#fff;padding-top:20%;'>" + tip_text +
                "<div id='" + $this.delid + "' style='position:absolute;top:5px;right:5px;display:block;' class='easyform-close'></div>" +
                "</div>";

            this.input.replaceWith(file + img + tip);

            var imgobj = $("#" + $this.imgid);
            var fileobj = $("#" + $this.fileid);

            var disabled = this.input.attr('disabled');

            if (!disabled)
            {
                imgobj.click(function ()
                {
                    fileobj.click();
                });

                $("#" + $this.imgid + ", #" + $this.tipid).hover(function (e)
                {
                    $("#" + $this.tipid).show();
                }, function (e)
                {
                    $("#" + $this.tipid).hide();
                });

                $("#" + $this.tipid).click(function ()
                {
                    fileobj.click();
                });

                $("#" + $this.delid).click(function (e)
                {
                    e.stopPropagation();
                    imgobj.attr("src", $this.options.default);
                    fileobj.val("");    //TODO 删除已选择的文件，未经测试。
                });

                $("#" + $this.fileid).change(function ()
                {
                    $this._onchange();
                });
            }

            return this;
        },

        _onchange: function ()
        {
            var file = $("#" + this.fileid)[0];
            var img_file = "";
            var imgobj = $("#" + this.imgid);

            //文件类型过滤
            this._type();

            this.last_file = imgobj.attr("src");

            //TODO 只有IE下能判断文件类型
            if (file.files && file.files[0])        //Firefox 下获取图片本地路径
            {
                img_file = window.URL.createObjectURL(file.files[0]);
                imgobj.attr("src", img_file);
            }
            else    //IE 下获取图片本地路径
            {
                file.select();

                img_file = document.selection.createRange().text;

                try
                {
                    imgobj[0].style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale)";
                    imgobj[0].filters.item("DXImageTransform.Microsoft.AlphaImageLoader").src = img_file;
                }
                catch (e)
                {
                    alert("请选择一个图片文件!");
                    return false;
                }

                document.selection.empty();
            }

            var onchange = this.input.attr("onchange");

            if (!!onchange)
            {
                eval(onchange);
            }
        },

        _type: function ()
        {

            var file = $("#" + this.fileid)[0];

            var filename = file.value;

            //获得扩展名
            var ext = filename.substr(filename.lastIndexOf(".") + 1).toLowerCase();

            if (-1 == this.options.type.indexOf(ext))
            {
                alert("请选择一个" + this.options.type + "文件!");
                this.reset();
            }
        },

        reset: function ()
        {
            var old = this.fileid;

            var file = "<input type='file' name='" + this.fileid + "'  id='" + this.fileid + "' style='display:none;' >";

            $("#" + old).replaceWith(file);

            var $this = this;

            $("#" + this.fileid).change(function ()
            {
                $this._onchange();
            });
        },

        val: function ()
        {
            return $("#" + this.fileid).val();
        }
    };

    $.fn.easyimagefile = function (options)
    {

        var eif = new _easyimagefile(this, options);

        return eif.init();
    };

})(jQuery, window, document);