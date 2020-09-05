
# LCA methodology to evaluate new technologies using USEEIO

OLD - THE FOLLOWING HAS BEEN CONVERTED TO HTML IN [INDEX.HTML](./)  


## Objective
Current USEEIO sectors are disaggregated into multiple sectors based on available process data. To represent the new technology/bio-product/bio-service, a similar existing technology/product/service will be disaggregated into the existing (traditional) and a bio-based version.

## What needs to be changed

Make and Use tables, A and B matrices , Y vector

## Information required for each new technology sector
- Which is the new sector to add (name and code).
- Which is the similar sector (BEA code).
- % of output of the original sector that new sector will produce.
- The amount spent in each of the n commodities to produce "Total Industry Output" in the new sector. (Including Z_(n+1,n+1))
- Data of all  environmental flows associated with the new sector. (Environmental flows per dollar of output of the new sector).


## Modeling Steps

These do not include software or management specificities, only include steps in a IO-LCA (EEIO) modelling considering some information about how it is implemented in useeior. We're applying the following steps in the [modeleearth useeior fork](https://github.com/modelearth/useeior/). Click "Clone or download" to begin.   

 The following steps are based on the LCA EEIO methodology in [LCAtextbook.com](https://www.lcatextbook.com/) and the way this model is implemented in useeior. Also based on the document "ERG_useeio disaggregation memo_draft.pdf" and others.

<!--We're using [LaTex in markdown](http://flennerhag.com/2017-01-14-latex/) to format equations. 
Here's an example: \\[ a^2 = b^2 + c^2 \\]  
<br>
You can generate equation from a screenshot using [mathpix.com](https://mathpix.com/).  -->

We are using [Transform Latex to URL Encoded](https://www.codecogs.com/latex/eqneditor.php) to transform equations in Latex to images using the svg option.

### 1. Modify Make Table

A. Modify dimensions (add additional row and column).  

B. Fill new row and column with data:  

- Row n+1 -> How much the new industry produces of each commodity (in dollar values)?

<!-- removed indent -->

Assuming no secondary products.  
Let s be the existing "similar" sector, 

>  For j= 1,2,...,n (here j is commodities){
     <br>
     ![](https://latex.codecogs.com/svg.latex?Z_%7Bn&plus;1%2C%20j%7D%3D0)
     <br>
     Don't forget to update:
     <br>
     ![equation](https://latex.codecogs.com/svg.latex?Z_%7Bs%2Cs%7D%3DZ_%7Bs%2Cs%7D%5Ccdot%281-%25%29)}
- Column n+1 ->  How much each industry produces of the new commodity (in dollar values)?

Assuming no secondary producers.  
> For i= 1, 2, …, n (Here i is industries){  
     <br>
     ![](https://latex.codecogs.com/svg.latex?Z_%20%7Bi%2C%20n&plus;1%7D%3D0)}
- Update diagonal elements
	
Assuming the inputs required by the new sector are produced by its primary producers.
> For i=1 to n+1{
	<br>
	![](https://latex.codecogs.com/svg.latex?Z_%7Bi%2Ci%7D%3DZ_%7Bi%2Ci%7D&plus;inputPurchases_i)
 }
 
- Recalculate totals
	
> Total Commodity Output and Total Industry Output

### 2. Modify Use Table

A. Modify dimensions (add additional row and column).  
B. Fill new row and column with data:  

- Row n+1 (Industry users/intermediate inputs)-> How much each of the industries use the new commodity to produce (in producer's prices)?  

> Let s be the existing "similar" sector,
	<br>
	For j=1,2,…, n,
	<br>
	![](https://latex.codecogs.com/svg.latex?Z_%7Bn&plus;1%2Cj%7D%3D%20Z_%7Bs%2Cj%7D%5Ccdot%20%25)
	
> Don't forget to update:
	<br>
	For j=1,2,…, n
	<br>
	![](https://latex.codecogs.com/svg.latex?Z_%7Bs%2Cj%7D%3DZ_%7Bs%2Cj%7D%5Ccdot%281-%25%29)
	<br>
	![](https://latex.codecogs.com/svg.latex?Z_%7Bn&plus;1%2C%20n&plus;1%7D%3D)From process data

- Row n+1 (Final users)-> How much final users/customers demand of the new commodity?  

> ![](https://latex.codecogs.com/svg.latex?Y_%7Bn&plus;1%7D%3DY_s%20%5Ccdot%20%25)

> and don't forget to update:
	<br>
	![](https://latex.codecogs.com/svg.latex?Y_s%3DY_s%20%5Ccdot%20%281-%25%29)

- Column n+1-> How much the new industry uses of each commodity to produce (in producer's prices)?  

> The amount spent in each of the n commodities to produce "Total Industry Output" in the new sector. From process data.
	
- Recalculate totals

>Total Intermediate Inputs
Total Intermediate Use
Total Final Uses
Total Commodity Output

- Which is the Value Added for this new industry? (its three components: returns to labor (compensation of employees), capital (gross operating surplus), and government (taxes on production and imports less subsidies))  

>VA= Total Industry Output- Total intermediate inputs
	<br>
	![](https://latex.codecogs.com/svg.latex?%5Ctext%7BTotal%20Intermediate%20Inputs%7D%3D%5Csum_%7Bi%3D1%7D%5E%7Bn&plus;1%7DZ_%7Bi%2Cn&plus;1%7D)
	<br>
Assumption: each of the three components get 1/3 of VA for balance purposes and since each component individually is not used.
	
- Recalculate totals
		
> Total Industry Output

### 3. Recalculate normalized Make/ Market Shares matrix

Recalculate V_n= each number in make table/ Total commodity output  

### 4. Recalculate normalized Use/ Direct Coefficients table

Recalculate U_n= each number in use table/Total industry output  

### 5. Update A matrix

Recalculate square direct requirement matrix A.

>Commodity x Commodity type:  
	A= U_n * V_n  
	<br>
	Industry x Industry type:  
	A= V_n * U_n  


### 6. Modify B matrix

Modify dimensions (add an additional column) to matrix B. (We have now 1 sector more).  

Fill data for new column (n+1) using  process data for each of the  environmental flows per dollar of output of new sector.  

### 7. Recalculate L matrix
Recalculate Total requirements matrix ![](https://latex.codecogs.com/svg.latex?L%3D%20%28I-A%29%5E%7B-1%7D)

### 8. Recalculate matrix D

Recalculate Direct Impact Matrix D= CB.  

### 9. Recalculate matrix M

Recalculate Total environmental flows use per dollar M=BL.  

### 10. Recalculate matrix U

Recalculate Total impacts per dollar matrix U= CM.  

### 11. Update final demand vector

Add one row to final demand vector.  

Fill the new row with the demand for the new sector extracting it from the updated Use Table.

### 12. Recalculate USEEIO model results  

Re-run calculateEEIOModel().


