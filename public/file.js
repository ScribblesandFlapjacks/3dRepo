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

app.directive(
    "tjsModelViewer",
    [function () {
        return {
            restrict: "E",
            scope: {
                assimpUrl: "=assimpUrl"
            },
            link: function (scope, elem, attr) {
                var camera;
                var scene;
                var renderer;
                var previous;

                // init scene
                init();

                // Load jeep model using the AssimpJSONLoader
                var loader1 = new THREE.OBJLoader();

                scope.$watch("assimpUrl", function(newValue, oldValue) {
                    if (newValue != oldValue) loadModel(newValue);
                });

                function loadModel(modelUrl) {
                    loader1.load(modelUrl, function (assimpjson) {
                        assimpjson.scale.x = assimpjson.scale.y = assimpjson.scale.z = 0.2;
                        assimpjson.updateMatrix();
                        if (previous) scene.remove(previous);
                        scene.add(assimpjson);

                        previous = assimpjson;
                    });
                }

                loadModel(scope.assimpUrl);
                animate();

                function init() {
                    camera = new THREE.PerspectiveCamera(5, window.innerWidth / window.innerHeight, 1, 2000);
                    camera.position.set(2, 4, 5);
                    scene = new THREE.Scene();
                    scene.fog = new THREE.FogExp2(0x000000, 0.035);
                    // Lights
                    scene.add(new THREE.AmbientLight(0xcccccc));
                    var directionalLight = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xeeeeee);
                    directionalLight.position.x = Math.random() - 0.5;
                    directionalLight.position.y = Math.random() - 0.5;
                    directionalLight.position.z = Math.random() - 0.5;
                    directionalLight.position.normalize();
                    scene.add(directionalLight);

                    // Renderer
                    renderer = new THREE.WebGLRenderer();
                    renderer.setSize(window.innerWidth-600, window.innerHeight-200);
                    elem[0].appendChild(renderer.domElement);

                    // Events
                    window.addEventListener('resize', onWindowResize, false);
                }

                //
                function onWindowResize(event) {
                    renderer.setSize(window.innerWidth-600, window.innerHeight-200);
                    camera.aspect = window.innerWidth-600 / window.innerHeight-200;
                    camera.updateProjectionMatrix();
                }

                //
                var t = 0;

                function animate() {
                    requestAnimationFrame(animate);
                    render();
                }

                //
                function render() {
                    var timer = Date.now() * 0.0005;
                    camera.position.x = Math.cos(timer) * 10;
                    camera.position.y = 4;
                    camera.position.z = Math.sin(timer) * 10;
                    camera.lookAt(scene.position);
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
        $scope.errorMessage="";
        fileApi.signGet($scope.fileDown.fileId,"")
            .success(function(data){
                $scope.assimpModelUrl=data.url;
                //fileApi.download(data)
                //    .success(function(data2){
                //        $scope.assimpModelUrl=;
                //      //  console.log(data2);
                //    })
                //    .error(function(){
                //        $scope.errorMessage="Failed to retrieve model";
                //    })
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
