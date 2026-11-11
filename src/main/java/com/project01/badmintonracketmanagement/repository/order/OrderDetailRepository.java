package com.project01.badmintonracketmanagement.repository.order;

import com.project01.badmintonracketmanagement.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {

    @Query("SELECT d FROM OrderDetail d JOIN FETCH d.product WHERE d.order.id = :orderId")
    List<OrderDetail> findByOrderIdWithProduct(@Param("orderId") Integer orderId);

    @Query("SELECT d FROM OrderDetail d JOIN FETCH d.product WHERE d.order.id IN :orderIds")
    List<OrderDetail> findByOrderIdsWithProduct(@Param("orderIds") Collection<Integer> orderIds);
}
