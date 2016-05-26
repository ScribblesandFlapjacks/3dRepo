var app = angular.module('files',[])
  .controller('fileCtrl',FileCtrl)
  .factory('fileApi',fileApi)
  .constant('apiUrl','http://localhost:1337')
  .directive('file', function() {
  return {
    restrict: 'AE',
    scope: {
      file: '@'
    },
    link: function(scope, el, attrs){
      el.bind('change', function(event){
        var files = event.target.files;
        var file = files[0];
        scope.file = file;
        scope.$parent.file = file;
        scope.$apply();
      });
    }
  };
});

app.directive('file2', function() {
    return {
        restrict: 'AE',
        scope: {
            file2: '@'
        },
        link: function(scope, el, attrs){
            el.bind('change', function(event){
                var files = event.target.files;
                var file = files[0];
                scope.file2 = file;
                scope.$parent.file2 = file;
                scope.$apply();
            });
        }
    };
});

app.directive(
    "tjsModelViewer",
    [function () {
        return {
            restrict: "E",
            scope: {
                assimpUrl: "=assimpUrl",
                ext: "=ext"
            },
            link: function (scope, elem, attr) {
                var camera;
                var scene;
                var renderer;
                var previous;
                var trackballControls;

                // init scene
                init();
                var clock = new THREE.Clock();
                var loader= new THREE.OBJLoader();
                var group = new THREE.Object3D();
                var extension;
                var dist;
                var fov;

                scope.$watch("assimpUrl", function(newValue, oldValue) {
                    if (newValue != oldValue) loadModel(newValue);
                });

                function getBounds(model){
                    trackballControls.reset();
                    //camera.position.set(0,0,0);
                    //camera.updateProjectionMatrix()
                    var bbox = new THREE.Box3().setFromObject(model);
                    var size = bbox.size();
                    dist = size.z * Math.sqrt(2);
                    var height = size.y;
                    fov = 2 * Math.atan(height / (20*dist)) * (180 / Math.PI);
                    camera.fov = fov;
                    camera.position.z = dist * 20;
                    camera.updateProjectionMatrix();
                    //console.log(bbox.size());
                    //console.log(camera.position.z);
                    //console.log(bbox.min.z);
                    //console.log(bbox.max.z);
                    console.log(dist);
                }

                function loadModel(modelUrl) {
                    console.log("I was called");
		            extension = scope.ext.split('.').pop();
                    trackballControls.target.set(0,0,0);
                    switch (extension){
                    case "obj":
                        console.log("OBJ");
                       loader = new THREE.OBJLoader().load(modelUrl, function (geometry) {
                        geometry.scale.x = geometry.scale.y = geometry.scale.z = 0.2;
                        geometry.updateMatrix();
                           getBounds(geometry);
                        if (previous) scene.remove(previous);
                        scene.add(geometry);

                        previous = geometry;
                    });
                       break;
			        case "stl":
                        console.log("stl")
                        loader = new THREE.STLLoader().load(modelUrl, function (geometry) {
                            var mesh = new THREE.Mesh(geometry);
                            getBounds(geometry);
                            if (previous) scene.remove(previous);
                            scene.add(mesh);
                            previous = mesh;
                        })
                        break;
			        case "ply":
                        console.log("ply");
                        loader = new THREE.PLYLoader().load(modelUrl, function (geometry) {
                            //var material = new THREE.PointCloudMaterial({
                            //    color: 0xffffff,
                            //    size: 0.4,
                            //    opacity: 0.6,
                            //    transparent: true,
                            //    blending: THREE.AdditiveBlending
                            //});
                            //group = new THREE.PointCloud(geometry,material);
                            //group.sortParticles = true;
                            if (previous) scene.remove(previous);
                            //scene.add(group);
                            var mesh = new THREE.Mesh(geometry);
                            getBounds(mesh);
                            scene.add(mesh);

                            previous = mesh;
                        });
                        break;
			       case "dae":
                       console.log("dae")
                       loader = new THREE.ColladaLoader().load(modelUrl, function (assimpjson) {
                           assimpjson.scale.x = assimpjson.scale.y = assimpjson.scale.z = 0.2;
                           assimpjson.updateMatrix();
                           getBounds(geometry);
                           if (previous) scene.remove(previous);
                           scene.add(assimpjson);

                           previous = assimpjson;
                       });
                       break;
		    }
                }

                //loadGui();
                loadModel(scope.assimpUrl);
                animate();

                function init() {
                    camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 1, 2000);
                    camera.position.set(0, 0, 0);
                    scene = new THREE.Scene();
                    //scene.fog = new THREE.FogExp2(0x000000, 0.035);
                    // Lights
                    //scene.add(new THREE.AmbientLight(0xcccccc));
                    var directionalLight = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xeeeeee,0.75);
                    directionalLight.position.set(1,1,1);
                    directionalLight.position.normalize();
                    scene.add(directionalLight);

                    var directionalLight2 = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xeeeeff,0.5);
                    directionalLight2.position.set(1,1,0);
                    directionalLight2.position.normalize();
                    scene.add(directionalLight2);

                    var directionalLight3 = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xf1eeee,0.75);
                    directionalLight3.position.set(-1,-1,0)
                    directionalLight3.position.normalize();
                    scene.add(directionalLight3);

                    var directionalLight4 = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xf1eeee,0.5);
                    directionalLight4.position.set(-1,-1,-1)
                    directionalLight4.position.normalize();
                    scene.add(directionalLight4);


                    // Renderer
                    renderer = new THREE.WebGLRenderer();
                    renderer.setSize(window.innerWidth/3, window.innerHeight/3);
                    elem[0].appendChild(renderer.domElement);

                    trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
                    trackballControls.target.set(0,0,0);
                    trackballControls.rotateSpeed= 15;
                    trackballControls.zoomSpeed = .5;
                    trackballControls.panSpeed = .025;
                    //trackballControls.staticMoving = true;
                    trackballControls.dynamicDampingFactor = 0.5;

                    // Events
                    window.addEventListener('resize', onWindowResize, false);
                    document.onkeydown = checkKey;
                }

                function resetScene(){
                    trackballControls.reset();
                    camera.fov = fov;
                    camera.position.z = dist * 20;
                    camera.updateProjectionMatrix();
                }

                function checkKey(e) {
                    e = e || window.event;
                    if (e.keyCode == '82') {
                        resetScene();
                    };
                    if (e.keyCode == '70'){
                        renderer.setSize(window.innerWidth, window.innerHeight);
                        camera.aspect = (window.innerWidth) / (window.innerHeight);
                        camera.updateProjectionMatrix();
                        THREEx.FullScreen.request(document.getElementById("scene"));
                    };
                };

                function modelCont(){
                    this.message = 'Woop';
                    this.speed = 0.5;
                };

                function loadGui() {
                    var uiText = new modelCont();
                    var gui = new dat.GUI();
                    gui.add(uiText, 'message');
                    gui.add(uiText, 'speed', 0, 1);
                    dat.GUI.toggleHide();
                };

                //
                function onWindowResize(event) {
                    if(window.innerHeight < screen.height) {
                        renderer.setSize(window.innerWidth / 3, window.innerHeight / 3);
                        camera.aspect = (window.innerWidth / 3) / (window.innerHeight / 3);
                        camera.updateProjectionMatrix();
                    }
                }

                //
                var t = 0;

                function animate() {
                    requestAnimationFrame(animate);
                    //var delta = clock.getDelta();
                    var previousTime = 0;
                    var currentTime = Date.now();
                    var delta = currentTime- previousTime;
                    previousTime = currentTime;
                    trackballControls.update(delta);
                    render();
                }


                function render() {
                   // var timer = Date.now() * 0.0005;
                    //camera.position.x = Math.cos(timer) * 10;
                    //camera.position.y = 4;
                   // camera.position.z = Math.sin(timer) * 10;
                    //camera.lookAt(scene.position);
                    renderer.render(scene, camera);
                }
            }
        }
    }
    ]);


function FileCtrl($scope,fileApi){

  $scope.files=[];
  $scope.errorMessage="";
  $scope.isLoading=isLoading;
  $scope.refreshFiles=refreshFiles;
    $scope.loginUser=loginUser;
    $scope.login=false;
    $scope.user= {
        userName: "test",
        pass: "testy"
    };
    $scope.registerUser={
        userName:"",
        pass: ""
    };
    $scope.currentUser="";
    $scope.registerUser=registerUser;
    $scope.logout=logout;
    $scope.uploadFile=uploadFile;
	$scope.modelName="";
	$scope.modelDesc="";
	$scope.modelTags="";
    $scope.uploadToggle=false;
    $scope.viewFiles=false;
    $scope.viewPermissions=false;
    $scope.viewDown=false;
    $scope.toggleDown=toggleDown;
    $scope.toggleUpload=toggleUpload;
    $scope.toggleFiles=toggleFiles;
    $scope.togglePermissions=togglePermissions;
    $scope.filePerm="";
    $scope.userPerm="";
    $scope.addPerm=addPerm;
    $scope.retrieveFile=retrieveFile;
    $scope.fileDown="";
    $scope.objUrl="https://s3.amazonaws.com/3drepo/UJajMCube.obj";
    $scope.text = 'Hello';
    $scope.assimpModelUrl = "";
    $scope.fileExt="";
    $scope.uploadType="";
    $scope.acceptedExt=["obj","ply","stl"];


  var loading = false;

  function isLoading(){
    return loading;
  }

    function toggleUpload(){
        if ($scope.uploadToggle) {
            $scope.uploadToggle = false;
        } else $scope.uploadToggle=true;
    }

    function toggleFiles(){
        if ($scope.viewFiles) {
            $scope.viewFiles = false;
        } else $scope.viewFiles=true;
    }

    function togglePermissions(){
        if ($scope.viewPermissions) {
            $scope.viewPermissions = false;
        } else $scope.viewPermissions=true;
    }

    function toggleDown(){
        if ($scope.viewDown) {
            $scope.viewDown = false;
            $scope.assimpModelUrl="";
            $scope.fileDown="";
        } else $scope.viewDown=true;
    }

  function refreshFiles(){
    loading = true;
    $scope.errorMessage="";
    fileApi.getFiles($scope.currentUser)
      .success(function(data){
        $scope.files=data;
        loading=false;
      })
      .error(function(){
        $scope.errorMessage="Failed to load files";
        loading=false;
      })
  }

    function loginUser($event){
        loading = true;
        $scope.errorMessage="";
        fileApi.login($scope.user.userName,$scope.user.pass)
            .success(function(data){
                $scope.currentUser=data[0].user;
                $scope.user.userName="";
                $scope.user.pass="";
                $scope.login=true;
                refreshFiles()
            })
            .error(function(){
                $scope.errorMessage="Failed to login"
            })
    }

    function registerUser($event){
        $scope.errorMessage="";
        fileApi.register($scope.registerUser.userName,$scope.registerUser.pass)
            .success(function(data){
                $scope.registerUser.pass="";
                window.location.assign('/');
               // $scope.login=true;
            })
            .error(function(){
                $scope.errorMessage="Failed to register";
            })
    }

    function logout($event){
        $scope.currentUser= null;
        $scope.login=false;
        $scope.viewFiles=false;
        $scope.uploadToggle=false;
        $scope.viewPermissions=false;
        $scope.viewDown=false;
        $scope.assimpModelUrl="";
    }

    function makeid()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
	
	function uploadFile($event){
		$scope.errorMessage="";
        var fileName = makeid() + $scope.file.name;
        console.log($scope.file.type);
		fileApi.signPut(fileName, $scope.file.type)
			.success(function(data){
				fileApi.upload(data,$scope.modelName,$scope.modelDesc,$scope.modelTags,$scope.file,fileName,$scope.currentUser)
					.success(function(){
                        $scope.file = "";
						$scope.modelName="";
						$scope.modelDesc="";
						$scope.modelTags="";
                        refreshFiles();
						console.log("File uploaded successfully")
					})
					.error(function(){
						$scope.errorMessage="Failed to Upload File";
					})
			})
			.error(function(){
				$scope.errorMessage="Failed to get signed URL";
			})
	}

    function retrieveFile(){
        console.log('retrieved file')
        $scope.errorMessage="";
        fileApi.signGet($scope.fileDown.fileId,"")
            .success(function(data){
                //$scope.assimpModelUrl=data.url;
                fileApi.download(data)
                    .success(function(data2){
                        $scope.fileExt=data.url;
                        $scope.assimpModelUrl= data2;
                        //console.log(data2);
                    })
                    .error(function(){
                        $scope.errorMessage="Failed to retrieve model";
                    })
            })
            .error(function(){
                $scope.errorMessage="Failed to get signature";
            })
    }

    function addPerm() {
        $scope.errorMessage = '';
        if ($scope.filePerm.owner == $scope.currentUser) {
            fileApi.updatePerm($scope.filePerm.fileId, $scope.userPerm)
                .success(function () {
                    $scope.filePerm = "";
                    $scope.userPerm = "";
                })
                .error(function () {
                    $scope.errorMessage = "Failed to update permissions"
                })
        }
    }


}


function fileApi($http,apiUrl){
  return{
    getFiles: function(user){
      var url = apiUrl + "/files?user=" + user;
      return $http.get(url);
    },
      login: function(user,pass){
          var url = apiUrl + "/login?user=" + user + "&pword=" + pass;
          return $http.get(url);
      },
      register: function(user,pass){
          var url = apiUrl + "/registerUser?user=" + user + "&pword=" + pass;
          return $http.get(url)
      },
	  signPut: function(filename,filetype){
		  var url = apiUrl + "/signPut?filename=" + filename + "&filetype=" + filetype;
		  return $http.get(url);
	  },
      signGet: function(filename,filetype){
          var url = apiUrl + "/signGet?filename=" + filename + "&filetype=" + filetype;
          return $http.get(url);
      },
	  upload: function(signature,name,desc,tags,file,filename,user){
          var url = apiUrl + '/upload?fileId=' + filename + '&size=' + file.size + '&modelName=' + name + '&modelDesc=' + desc + '&modelTags=' + tags + '&user=' + user;
          var xhr = new XMLHttpRequest();
          xhr.open("PUT", signature.signed_request);
          xhr.setRequestHeader('x-amz-acl', 'public-read');
          xhr.onload = function() {
              if (xhr.status === 200) {
                  done()
              }
          };
          xhr.send(file);
		  //$http.post(signature.signed_request,file);
		  return $http.post(url)
	  },
      download: function(signature){
          return $http.get(signature.signed_request);
      },
      updatePerm: function(file,user){
          var url = apiUrl + "/perm?file=" + file + "&user=" + user;
          return $http.post(url);
      }
  }
}
