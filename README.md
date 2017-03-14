# jquery.mjax

Bootstrap Modal for any anchor mark by Ajax

![模态框](images/mjax.gif)

> NOTE

add new httpcode 309 (X-Mjax-Redirect)  to redirect by self, need replace 302 to 309 by server

[yii2-mjax](https://github.com/dungang/yii2-mjax)

> Open a simple Boostrap Modal

add a class `mjax` to <a>

```
<a class="btn btn-primary btn-lg mjax" href="content.html" role="button">Open a Simple Modal</a>
```

> open a form Boostrap Modal

yes! add a class `mjax` to <a> too!

```
<a class="btn btn-primary btn-lg mjax" href="form.html" role="button">Open a Form Modal</a>
```

> open a point form Boostrap Modal

what's a point form ?

like this

```
<form id="point-form" action="form-result.html" method="post">
  <div class="form-group">
    <label for="exampleInputEmail1">Email address</label>
    <input type="email" class="form-control" id="exampleInputEmail1" placeholder="Email">
  </div>
  <div class="form-group">
    <label for="exampleInputPassword1">Password</label>
    <input type="password" class="form-control" id="exampleInputPassword1" placeholder="Password">
  </div>
  <div class="form-group">
    <label for="exampleInputFile">File input</label>
    <input type="file" id="exampleInputFile">
    <p class="help-block">Example block-level help text here.</p>
  </div>
  <div class="checkbox">
    <label>
      <input type="checkbox"> Check me out
    </label>
  </div>
  <button type="submit" class="btn btn-default">Submit</button>
</form>
<script>
    $(document).ready(function(){
        alert("It's a point form!");
        $('#point-form').on('submit',function(event){
            var _form = $(this);
            //here a even point
            var event = $.Event('beforSubmit');
            _form.trigger(event);
            if (event.result === false) {
                //do something
                return false;
            } else {
                //do something
                return true;
            }
        });
    });
</script>
```
how we do ?

 -  add `data-point` and `data-point-event` to the form

like this

```
<form 
id="point-form" 

data-point="true" 
data-point-event="beforSubmit" 

action="form-result.html" method="post">

```
 - add `data-point-attr` and `data-point-event` to the form

for Yii2 

```
<form 
id="point-form" 

data-point-attr="yiiActiveForm" 
data-point-event="beforSubmit" 

action="form-result.html" method="post">

```

- pass init options

```
$('#a').mjax({
    point:true,
    pointEvent:'beforSubmit'
});

```
or 

```
$('#a').mjax({
    pointAttr:'yiiActiveForm',
    pointEvent:'beforSubmit'
});

```