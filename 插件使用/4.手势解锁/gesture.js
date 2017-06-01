(function() {
    window.Gesture = function() {
        // 三行三列
        this.format = 3;
    };

    function getDis(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    };

    Gesture.prototype.makeState = function() {
        if (this.pswObj.step == 0) {
            document.getElementById('message').innerHTML = '设置手势密码图案';
        } else if (this.pswObj.step == 1) {
            document.getElementById('message').innerHTML = '请解锁手势密码';
        } else {
            document.getElementById('message').innerHTML = '再次设置手势密码图案';
        }
    }

    Gesture.prototype.init = function() {
        this.cnt = 0;
        this.pswObj = $api.getStorage('passwordxx') ? {
            step: $api.getStorage('step') || 0,
            spassword: JSON.parse($api.getStorage('passwordxx'))
        } : { step: 0 };
        this.lastPoint = [];
        this.makeState();
        this.touchFlag = false;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.createCircle();
        this.bindEvent();
    }

    Gesture.prototype.createCircle = function() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        var n = this.format;
        var count = 0;
        this.r = this.ctx.canvas.width / (2 + 4 * n); // 公式计算
        this.lastPoint = [];
        this.arr = [];
        this.restPoint = [];
        var r = this.r;
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                count++;
                var obj = {
                    x: j * 4 * r + 3 * r,
                    y: i * 4 * r + 3 * r,
                    index: count
                };
                this.arr.push(obj);
                this.restPoint.push(obj);
                this.drawCle(obj.x, obj.y);
            }
        }
    }

    Gesture.prototype.drawCle = function(x, y) { // 初始化解锁密码面板
        this.ctx.strokeStyle = '#95dbdd';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    Gesture.prototype.bindEvent = function() {
        var self = this;
        this.canvas.addEventListener("touchstart", function(e) {
            e.preventDefault();
            var po = self.getPosition(e);
            for (var i = 0; i < self.arr.length; i++) {
                if (Math.abs(po.x - self.arr[i].x) < self.r && Math.abs(po.y - self.arr[i].y) < self.r) {
                    self.touchFlag = true;
                    self.drawPoint(self.arr[i].x, self.arr[i].y);
                    self.lastPoint.push(self.arr[i]);
                    self.restPoint.splice(i, 1);
                    break;
                }
            }
        }, false);
        this.canvas.addEventListener("touchmove", function(e) {
            if (self.touchFlag)
                self.update(self.getPosition(e));
        }, false);
        this.canvas.addEventListener("touchend", function(e) {
            if (self.touchFlag) {
                self.touchFlag = false;
                self.storePass(self.lastPoint);
                setTimeout(function() {
                    self.reset();
                }, 300);
            }
        }, false);
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, false);
    }

    // 初始化圆心
    Gesture.prototype.drawPoint = function() {
        for (var i = 0; i < this.lastPoint.length; i++) {
            this.ctx.fillStyle = '#CFE6FF';
            this.ctx.beginPath();
            this.ctx.arc(this.lastPoint[i].x, this.lastPoint[i].y, this.r / 2, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    Gesture.prototype.drawStatusPoint = function(type) { // 初始化状态线条
        for (var i = 0; i < this.lastPoint.length; i++) {
            this.ctx.strokeStyle = type;
            this.ctx.beginPath();
            this.ctx.arc(this.lastPoint[i].x, this.lastPoint[i].y, this.r, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    Gesture.prototype.drawLine = function(po, lastPoint) { // 解锁轨迹
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(this.lastPoint[0].x, this.lastPoint[0].y);
        for (var i = 1; i < this.lastPoint.length; i++)
            this.ctx.lineTo(this.lastPoint[i].x, this.lastPoint[i].y);
        this.ctx.lineTo(po.x, po.y);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    Gesture.prototype.pickPoints = function(fromPt, toPt) {
        var lineLength = getDis(fromPt, toPt);
        var dir = toPt.index > fromPt.index ? 1 : -1;
        var len = this.restPoint.length;
        var i = dir === 1 ? 0 : (len - 1);
        var limit = dir === 1 ? len : -1;
        while (i !== limit) {
            var pt = this.restPoint[i];
            if (getDis(pt, fromPt) + getDis(pt, toPt) === lineLength) {
                this.drawPoint(pt.x, pt.y);
                this.lastPoint.push(pt);
                this.restPoint.splice(i, 1);
                if (limit > 0) {
                    i--;
                    limit--;
                }
            }
            i += dir;
        }
    }


    Gesture.prototype.getPosition = function(e) { // 获取touch点相对于canvas的坐标
        var rect = e.currentTarget.getBoundingClientRect();
        var po = {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
        return po;
    }

    Gesture.prototype.reset = function() {
        this.makeState();
        this.createCircle();
    }

    // 核心变换方法在touchmove时候调用
    Gesture.prototype.update = function(po) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (var i = 0; i < this.arr.length; i++) // 每帧先把面板画出来
            this.drawCle(this.arr[i].x, this.arr[i].y);
        this.drawPoint(this.lastPoint); // 每帧花轨迹
        this.drawLine(po, this.lastPoint); // 每帧画圆心
        for (var i = 0; i < this.restPoint.length; i++) {
            var pt = this.restPoint[i];
            if (Math.abs(po.x - pt.x) < this.r && Math.abs(po.y - pt.y) < this.r) {
                this.drawPoint(pt.x, pt.y);
                this.pickPoints(this.lastPoint[this.lastPoint.length - 1], pt);
                break;
            }
        }
    }

    Gesture.prototype.checkPass = function(psw1, psw2) { // 检测密码
        if (psw1 == null || psw1 == undefined) {
            $api.setStorage('step', 0);
            return false;
        }
        var p1 = '',
            p2 = '';
        for (var i = 0; i < psw1.length; i++)
            p1 += psw1[i].index + psw1[i].index;
        for (var i = 0; i < psw2.length; i++)
            p2 += psw2[i].index + psw2[i].index;
        return p1 === p2;
    }

    Gesture.prototype.storePass = function(psw) { // touchend结束之后对密码和状态的处理
        if (this.pswObj.step == 0) {
            this.cnt = 0;
            delete this.pswObj.step;
            this.pswObj.fpassword = psw;
        } else if (this.pswObj.step == 1) {
            if (this.checkPass(this.pswObj.spassword, psw)) {
                this.cnt = 0;
                this.drawStatusPoint('#2CFF26');
                api.toast({
                    msg: '解锁成功！',
                    duration: 1000,
                    location: "middle"
                });
                setTimeout(function() {
                    toHome();
                }, 300);
            } else {
                this.cnt++;
                this.drawStatusPoint('red');
                api.toast({
                    msg: '解锁失败！',
                    duration: 1000,
                    location: "middle"
                });
                if (this.cnt >= 3) {
                    $api.rmStorage('token');
                    $api.setStorage('step', 0);
                    api.toast({
                        msg: '错误次数到达三次，请重新设置！',
                        duration: 1000,
                        location: "middle"
                    });
                    setTimeout(function() {
                        toLogin();
                    }, 300);
                }
            }
        } else {
            if (this.checkPass(this.pswObj.fpassword, psw)) {
                this.cnt = 0;
                this.pswObj.spassword = psw;
                this.drawStatusPoint('#2CFF26');
                $api.setStorage("passwordxx", JSON.stringify(this.pswObj.spassword));
                $api.setStorage('step', 1);
                api.toast({
                    msg: '密码设置成功！',
                    duration: 1000,
                    location: "middle"
                });
                setTimeout(function() {
                    toHome();
                }, 300);
            } else {
                this.drawStatusPoint('red');
                this.cnt++;
                if (this.cnt >= 3) {
                    this.pswObj.step = 0
                    api.toast({
                        msg: '错误次数到达三次，请重新绘制！',
                        duration: 1000,
                        location: "middle"
                    });
                } else {
                    delete this.pswObj.step;
                    api.toast({
                        msg: '两次不一致，重新输入！',
                        duration: 1000,
                        location: "middle"
                    });
                }
            }
        }
    }
})();