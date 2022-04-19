var toc = document.querySelector( '.toc' );
var tocPath = document.querySelector( '.toc-marker path' );
var tocItems;

// Factor of screen size that the element must cross
// before it's considered visible
var TOP_MARGIN = 0.1,
    BOTTOM_MARGIN = 0.2;

var pathLength;

var lastPathStart, lastPathEnd;

window.addEventListener( 'resize', drawPath, false );
window.addEventListener( 'scroll', sync, false );

drawPath();

function drawPath() {
  
  tocItems = [].slice.call( toc.querySelectorAll( 'li' ) );

  // Cache element references and measurements
  tocItems = tocItems.map( function( item ) {
    var anchor = item.querySelector( 'a' );
    var target = document.getElementById( anchor.getAttribute( 'href' ).slice( 1 ) );

    return {
      listItem: item,
      anchor: anchor,
      target: target
    };
  } );

  // Remove missing targets
  tocItems = tocItems.filter( function( item ) {
    return !!item.target;
  } );

  var path = [];
  var pathIndent;

  tocItems.forEach( function( item, i ) {

    var x = item.anchor.offsetLeft - 5,
        y = item.anchor.offsetTop,
        height = item.anchor.offsetHeight;

    if( i === 0 ) {
      path.push( 'M', x, y, 'L', x, y + height );
      item.pathStart = 0;
    }
    else {
      // Draw an additional line when there's a change in
      // indent levels
      if( pathIndent !== x ) path.push( 'L', pathIndent, y );

      path.push( 'L', x, y );
      
      // Set the current path so that we can measure it
      tocPath.setAttribute( 'd', path.join( ' ' ) );
      item.pathStart = tocPath.getTotalLength() || 0;
      
      path.push( 'L', x, y + height );
    }
    
    pathIndent = x;
    
    tocPath.setAttribute( 'd', path.join( ' ' ) );
    item.pathEnd = tocPath.getTotalLength();

  } );
  
  pathLength = tocPath.getTotalLength();
  
  sync();
  
}

function sync() {
  
  var windowHeight = window.innerHeight;
  
  var pathStart = pathLength,
      pathEnd = 0;
  
  var visibleItems = 0;
  
  tocItems.forEach( function( item ) {

    var targetBounds = item.target.getBoundingClientRect();
    
    if( targetBounds.bottom > windowHeight * TOP_MARGIN && targetBounds.top < windowHeight * ( 1 - BOTTOM_MARGIN ) ) {
      pathStart = Math.min( item.pathStart, pathStart );
      pathEnd = Math.max( item.pathEnd, pathEnd );
      
      visibleItems += 1;
      
      item.listItem.classList.add( 'visible' );
    }
    else {
      item.listItem.classList.remove( 'visible' );
    }
    
  } );

  // Specify the visible path or hide the path altogether
  // if there are no visible items
  if( visibleItems > 0 && pathStart < pathEnd ) {
    if( pathStart !== lastPathStart || pathEnd !== lastPathEnd ) {
      tocPath.setAttribute( 'stroke-dashoffset', '1' );
      tocPath.setAttribute( 'stroke-dasharray', '1, '+ pathStart +', '+ ( pathEnd - pathStart ) +', ' + pathLength );
      tocPath.setAttribute( 'opacity', 1 );
    }
  }
  else {
    tocPath.setAttribute( 'opacity', 0 );
  }

  lastPathStart = pathStart;
  lastPathEnd = pathEnd;

}


// 底部烟花特效

// /////////////////首先我们创建一些全局变量
    // 创建一块画布
    let canvas=document.getElementById('canvas'),
        ctx=canvas.getContext('2d'),
        // 获取屏幕的宽度和高度
        cw=window.innerWidth,
        ch=window.innerHeight,
        // 保存烟花的数组
        fireworks=[],
        // 保存烟花颗粒的数组
        particles=[],
        // 后面画图是会用到hsl模式，这个是颜色的初始值
        hue=120,
        // 记录鼠标的坐标
        mx,my,
    // 把画布的长和宽设置为屏幕的长和宽
        limiterTotal=80,
        limiterNow=0;
    canvas.width=cw;
    canvas.height=ch;

// 写几个辅助函数
function random(min,max){
    // 返回给定区间的随机数，方便后面随机数的产生
    return Math.random()*(max-min)+min;
}

function calculateDistance( p1x, p1y, p2x, p2y ) {
	var xDistance = p1x - p2x,
			yDistance = p1y - p2y;
    // 初中学过的两点间的距离公式
	return Math.sqrt( Math.pow( xDistance, 2 ) + Math.pow( yDistance, 2 ) );
}

////////基本工作准备完毕，开始写我们的烟花对象，
///////我是采用原型链的方式进行对象的创建

//Firework class
// 创建对象需要传入烟花的开始和结束坐标
function Firework(sx,sy,tx,ty){
    // 烟花当前的坐标
    this.x=sx;
    this.y=sy;
    // 烟花的开始坐标
    this.sx=sx;
    this.sy=sy;
    // 烟花的目的坐标
    this.tx=tx;
    this.ty=ty;
    // 烟花当前距离目的地的距离
    this.distanceToTarget=calculateDistance(sx,sy,tx,ty);
    // 烟花已经走过的路程
    this.distanceTraveled=0;
    //  利用反三角函数计算烟花的倾斜角
    this.angle=Math.atan2(ty-sy,tx-sx);
    // 烟花的基本速度
    this.speed=2;
    // 烟花上升的加速度，会有一种加速的效果
    this.acceleration=1.05;
    // 随机一个烟花的亮度值，后面绘制时会用到
    this.brightness=random(50,70);
    // 烟花到达目的地后小圆圈的半径
    this.targetRadius=1;
    // 我们把烟花升空的过程分成3段来绘制
    this.coordinateCount=3;
    this.coordinates=[]
    // 用烟花的初始位置来初始化烟花位置数组
    while(this.coordinateCount--){
        this.coordinates.push([this.x,this.y]);
    }
}

// 使用H5的canvas API在屏幕上进行绘图
Firework.prototype.draw=function(){
    // 开始一条路径
    ctx.beginPath();
    // 利用这两个函数来画一条线，起点是上一个坐标位置，终点是当前烟花移动后的位置
    // ctx.moveTo(this.coordinates[this.coordinateCount-1][0],this.coordinates[this.coordinateCount-1][1])
    ctx.moveTo(this.coordinates[this.coordinates.length-1][0],this.coordinates[this.coordinates.length-1][1])
    ctx.lineTo(this.x,this.y)
    ctx.strokeStyle='hsl('+hue+',100%,'+this.brightness+'%)';//这里要对变量进行拼接
    ctx.stroke();
    // 这就绘制出一条线了

    // 把小圆圈画上
    ctx.beginPath();
    ctx.arc(this.tx,this.ty,this.targetRadius,0,Math.PI*2);
    ctx.stroke();
}

// 对烟花的位置数据进行更新
Firework.prototype.update=function(index){
    // 现在开始更新烟花的位置数据
    //首先我们要移除坐标数组中的最后一个坐标，然后把上一个位置插入到数组的最前面
    this.coordinates.pop()
    this.coordinates.unshift([this.x,this.y])

    ///更新小圆圈数据
    if(this.targetRadius<8){
        this.targetRadius+=0.3
    }else{
        this.targetRadius=1
    }
    // this.speed=this.speed*this.acceleration;
    // 把速度提升一下，这样产生一个加速效果
    this.speed=this.speed*this.acceleration;
    // 利用三角函数计算出横纵坐标的偏移量
    let vx=Math.cos(this.angle)*this.speed,
        vy=Math.sin(this.angle)*this.speed;

    //我们先计算出烟花已经走过的路程
    this.distanceTraveled=calculateDistance(this.sx,this.sy,this.x+vx,this.y+vy)
    // 如果数烟花已经走到了终点，那么我们把这个烟花进行销毁，并且让烟花爆炸
    if(this.distanceTraveled>=this.distanceToTarget){
        fireworks.splice(index,1)
        // console.log("烟花爆炸")//这里先模拟 后面再写烟花爆炸
        // 现在我们把模拟的爆炸变为现实
        createParticle(this.tx,this.ty)
    // 如果没走到终点，那么我们继续往前走
    }else{
        // 更新烟花的位置
    this.x+=vx;
    this.y+=vy;
    }
    
}

//开始写烟花爆炸颗粒对象

function Particle(x,y){
    // 大部分的变量和烟花对象差不多
    // 当前坐标
    this.x=x;
    this.y=y;
    // 角度
    this.angle=random(0,Math.PI*2);
    // 速度
    this.speed=random(1,10)
    // 摩擦系数
    this.friction=0.95
    // 重力加速度
    this.gravity=1;
    // hsl模式的灰度值，随机一个
    this.hue=random(hue-20,hue+20)
    // 亮度
    this.brightness=random(50,80)
    // 透明度
    this.alpha=1;
    // 亮度的衰变率
    this.decay=random(0.015,0.03)

    this.coordinates=[];
    // 这里我把颗粒的路径分成了5段来绘制
    this.coordinateCount=5;
    while(this.coordinateCount--){
        this.coordinates.push([this.x,this.y])
    }

}
Particle.prototype.draw=function(){
    ctx.beginPath();
    ctx.moveTo(this.coordinates[this.coordinates.length-1][0],this.coordinates[this.coordinates.length-1][1])
    ctx.lineTo(this.x,this.y)
    ctx.strokeStyle='hsla('+hue+',100%,'+this.brightness+'%,'+this.alpha+')';//这里要对变量进行拼接,加一个透明变量进来
    ctx.stroke();
}
Particle.prototype.update=function(index){
    //首先我们要移除坐标数组中的最后一个坐标，然后把上一个位置插入到数组的最前面
    this.coordinates.pop()
    this.coordinates.unshift([this.x,this.y])

    // 增加摩檫力，让粒子跌落的速度变慢
    this.speed*=this.friction;

    this.x+=Math.cos(this.angle)*this.speed;
    this.y+=Math.sin(this.angle)*this.speed+this.gravity;

    //让透明度不断变小
    this.alpha-=this.decay;

    //如果透明度低于decay值了，说明肉眼已经看不到了，这时我们就将起销毁
    if(this.alpha<=this.decay){
        particles.splice(index,1)
    }
}

// 写一个创建烟花爆炸效果的函数
function createParticle(x,y){
    let partcicleCount=100
    while(partcicleCount--){
        particles.push(new Particle(x,y))
    }
}

// createParticle(cw/2,ch/2)
//基本的烟花对象就写好了，我们先来测试一下
// function createFirework(){
//     for(let i=0;i<3;i++){
//         // 创建一个烟花，起始点在底部中间位置，终点为随机位置
//         fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) )
//     }
// }

// createFirework()

function run(){
    hue++
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.fillRect( 0, 0, cw, ch );
    var i=fireworks.length;
    while(i--){
        fireworks[i].draw();
        fireworks[i].update(i);
    }
    var k=particles.length;
    while(k--){
        particles[k].draw();
        particles[k].update(k);
    }
    // 写一个小算法，让烟花自动产生，有几行就同时射几次
    if(limiterNow>=limiterTotal){
        // 同时射7下
        fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) );
        fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) );
        fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) );
        fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) );
        fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) );
        fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) );
        fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch/2 ) ) );
        limiterNow=0;
    }else{
        limiterNow++
    }
}
 //给画布添加鼠标事件，用鼠标点击来产生烟花
 canvas.addEventListener('mousedown',function(e){
    //  获取鼠标的坐标，有一定的偏移，所以需要矫正一下
     mx=e.pageX-canvas.offsetLeft;
     my=e.pageY-canvas.offsetTop;
     fireworks.push( new Firework( cw / 2, ch, mx,my ) )
 })
setInterval(run,33)//每隔33毫秒刷新一下屏幕
